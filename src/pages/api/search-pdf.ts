import type { APIRoute } from 'astro';

export const prerender = false;

interface SearchRequest {
  termekNev: string;
  gyarto: string;
}

interface PdfResult {
  url: string;
  title: string;
  source: string;
  snippet?: string;
}

// Gemini API response types
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    groundingMetadata?: {
      searchEntryPoint?: {
        renderedContent?: string;
      };
      groundingChunks?: Array<{
        web?: {
          uri?: string;
          title?: string;
        };
      }>;
      webSearchQueries?: string[];
    };
  }>;
  error?: {
    message: string;
    code?: number;
  };
}

// Gyártói URL pattern-ek - fallback ha nincs API kulcs
const MANUFACTURER_PATTERNS: Record<string, {
  baseUrl: string;
  domain: string;
  pdfPath: (productName: string) => string[];
  searchUrl: string;
}> = {
  'Elicent': {
    baseUrl: 'https://www.elicent.it',
    domain: 'elicent.it',
    pdfPath: (name) => {
      // Elicent uses date-based naming: AXC-16-5-18.pdf, ELIX-100-xxx.pdf, etc.
      const cleanName = name.toUpperCase().replace(/\s+/g, '-');
      return [
        // Try common date patterns
        `/content/uploads/2018/04/${cleanName}-16-5-18.pdf`,
        `/content/uploads/2019/${cleanName}.pdf`,
        `/content/uploads/2020/${cleanName}.pdf`,
        `/content/uploads/2021/${cleanName}.pdf`,
        `/content/uploads/2022/${cleanName}.pdf`,
        `/content/uploads/2023/${cleanName}.pdf`,
        // Generic patterns
        `/download/schede-tecniche/${name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      ];
    },
    searchUrl: 'https://www.elicent.it/en/products/',
  },
  'Maico': {
    baseUrl: 'https://www.maico-ventilatoren.com',
    domain: 'maico-ventilatoren.com',
    pdfPath: (name) => [
      `/media/pdf/${name.toLowerCase()}.pdf`,
    ],
    searchUrl: 'https://www.maico-ventilatoren.com/products/',
  },
  'Blauberg': {
    baseUrl: 'https://blaubergvento.de',
    domain: 'blaubergvento.de',
    pdfPath: (name) => [
      `/upload/files/${name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
    ],
    searchUrl: 'https://blaubergvento.de/en/products/',
  },
  'Vents': {
    baseUrl: 'https://ventilation-system.com',
    domain: 'ventilation-system.com',
    pdfPath: (name) => [
      `/upload/medialibrary/${name.toUpperCase()}.pdf`,
      `/products/${name.toLowerCase()}/datasheet.pdf`,
    ],
    searchUrl: 'https://ventilation-system.com/catalog/',
  },
  'Awenta': {
    baseUrl: 'https://www.awenta.pl',
    domain: 'awenta.pl',
    pdfPath: (name) => [
      `/files/products/${name.toLowerCase()}.pdf`,
    ],
    searchUrl: 'https://www.awenta.pl/en/products/',
  },
  'Helios': {
    baseUrl: 'https://www.heliosventilatoren.de',
    domain: 'heliosventilatoren.de',
    pdfPath: (name) => [
      `/fileadmin/documents/datenblaetter/${name}.pdf`,
    ],
    searchUrl: 'https://www.heliosventilatoren.de/de/produkte/',
  },
  'Vortice': {
    baseUrl: 'https://www.vortice.com',
    domain: 'vortice.com',
    pdfPath: (name) => [
      `/media/products/${name.toLowerCase()}.pdf`,
    ],
    searchUrl: 'https://www.vortice.com/products/',
  },
};

/**
 * Get Gemini API key from Cloudflare runtime or environment
 */
function getGeminiApiKey(locals: unknown): string | undefined {
  const runtime = (locals as { runtime?: { env?: { GEMINI_API_KEY?: string } } }).runtime;
  return runtime?.env?.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
}

/**
 * Call Gemini API with search grounding
 */
async function callGeminiWithSearch(prompt: string, apiKey: string): Promise<GeminiResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        tools: [{
          googleSearch: {}
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        }
      }),
    }
  );

  return response.json();
}

/**
 * Extract PDF results from Gemini response
 */
function extractResultsFromGemini(data: GeminiResponse, preferredDomain?: string): PdfResult[] {
  const results: PdfResult[] = [];
  const seenUrls = new Set<string>();

  // Extract URLs from grounding metadata
  const groundingChunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    for (const chunk of groundingChunks) {
      const uri = chunk.web?.uri;
      if (uri && !seenUrls.has(uri)) {
        // Check if it's a PDF or datasheet related
        const lowerUri = uri.toLowerCase();
        const isPdfRelated = lowerUri.includes('.pdf') ||
                           lowerUri.includes('datasheet') ||
                           lowerUri.includes('download') ||
                           lowerUri.includes('technical') ||
                           lowerUri.includes('specification') ||
                           lowerUri.includes('scheda') ||
                           lowerUri.includes('katalog');

        if (isPdfRelated || (preferredDomain && uri.includes(preferredDomain))) {
          seenUrls.add(uri);
          try {
            const hostname = new URL(uri).hostname;
            results.push({
              url: uri,
              title: chunk.web?.title || 'Adatlap',
              source: hostname,
              snippet: preferredDomain && hostname.includes(preferredDomain) ? '🏭 Gyártói forrás' : undefined,
            });
          } catch {
            // Invalid URL
          }
        }
      }
    }
  }

  // Extract URLs from text response
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Match URLs more broadly
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const textUrls = textResponse.match(urlRegex) || [];

  for (const url of textUrls) {
    // Clean URL (remove trailing punctuation)
    const cleanUrl = url.replace(/[.,;:!?)]+$/, '');

    if (!seenUrls.has(cleanUrl)) {
      const lowerUrl = cleanUrl.toLowerCase();
      const isPdfRelated = lowerUrl.includes('.pdf') ||
                          lowerUrl.includes('datasheet') ||
                          lowerUrl.includes('download');

      if (isPdfRelated) {
        seenUrls.add(cleanUrl);
        try {
          const hostname = new URL(cleanUrl).hostname;
          results.push({
            url: cleanUrl,
            title: 'PDF adatlap',
            source: hostname,
          });
        } catch {
          // Invalid URL
        }
      }
    }
  }

  // Sort: preferred domain first
  if (preferredDomain) {
    results.sort((a, b) => {
      const aIsPreferred = a.source.includes(preferredDomain) ? 0 : 1;
      const bIsPreferred = b.source.includes(preferredDomain) ? 0 : 1;
      return aIsPreferred - bIsPreferred;
    });
  }

  return results;
}

/**
 * Search using Gemini API with Google Search Grounding
 * First tries manufacturer site, then general search
 */
async function geminiSearch(termekNev: string, gyarto: string, apiKey: string): Promise<{ results: PdfResult[]; searchType: string }> {
  const manufacturerPattern = MANUFACTURER_PATTERNS[gyarto];
  const preferredDomain = manufacturerPattern?.domain;

  // Step 1: Search on manufacturer website first
  if (preferredDomain) {
    const manufacturerPrompt = `Keresd meg a "${gyarto} ${termekNev}" termék PDF adatlapját!

Keress CSAK itt: site:${preferredDomain}

Keress:
- PDF adatlap (datasheet)
- Műszaki specifikáció
- Termék dokumentáció
- Letöltés link

Add meg a talált PDF URL-eket. Ha találsz .pdf linket, azt mindenképpen add meg!`;

    try {
      const manufacturerData = await callGeminiWithSearch(manufacturerPrompt, apiKey);

      if (manufacturerData.error) {
        console.error('Gemini manufacturer search error:', manufacturerData.error);
      } else {
        const manufacturerResults = extractResultsFromGemini(manufacturerData, preferredDomain);
        if (manufacturerResults.length > 0) {
          return { results: manufacturerResults, searchType: 'manufacturer' };
        }
      }
    } catch (err) {
      console.error('Manufacturer search failed:', err);
    }
  }

  // Step 2: General search if manufacturer search didn't work
  const generalPrompt = `Keresd meg a "${gyarto} ${termekNev}" ventilátor PDF adatlapját!

Keress:
1. A gyártó hivatalos oldalán (${gyarto.toLowerCase()}.com, ${gyarto.toLowerCase()}.it, ${gyarto.toLowerCase()}.de)
2. Magyar webshopokban (ventilatorhaz.hu, szelep.hu, szelloztetes.hu)
3. Bármilyen megbízható forráson

Fontos: PDF fájlokat keresek - datasheet, műszaki adatlap, specifikáció.
Add meg az összes talált PDF URL-t!`;

  try {
    const generalData = await callGeminiWithSearch(generalPrompt, apiKey);

    if (generalData.error) {
      throw new Error(generalData.error.message);
    }

    const generalResults = extractResultsFromGemini(generalData, preferredDomain);
    return { results: generalResults, searchType: 'general' };
  } catch (err) {
    console.error('General search failed:', err);
    throw err;
  }
}

/**
 * Fallback to URL patterns when no API key
 */
function getPatternResults(termekNev: string, gyarto: string): { results: PdfResult[]; suggestions: string[] } {
  const results: PdfResult[] = [];
  const suggestions: string[] = [];

  const pattern = MANUFACTURER_PATTERNS[gyarto];

  if (pattern) {
    const possibleUrls = pattern.pdfPath(termekNev);
    possibleUrls.forEach((path, index) => {
      results.push({
        url: `${pattern.baseUrl}${path}`,
        title: `${gyarto} ${termekNev} adatlap (minta URL #${index + 1})`,
        source: `${pattern.domain} (ellenőrizd!)`,
      });
    });

    suggestions.push(
      `Google: site:${pattern.domain} "${termekNev}" filetype:pdf`,
      `Látogasd meg: ${pattern.searchUrl}`,
    );
  } else {
    suggestions.push(
      `Google: "${gyarto} ${termekNev}" datasheet PDF`,
      `Google: "${gyarto} ${termekNev}" műszaki adatlap`,
    );
  }

  return { results, suggestions };
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body: SearchRequest = await request.json();
    const { termekNev, gyarto } = body;

    if (!termekNev || !gyarto) {
      return new Response(JSON.stringify({
        error: 'Hiányzó mezők: termekNev, gyarto'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiApiKey = getGeminiApiKey(locals);

    // Ha van Gemini API kulcs, használjuk a Gemini + Google Search-öt
    if (geminiApiKey) {
      try {
        const { results, searchType } = await geminiSearch(termekNev, gyarto, geminiApiKey);

        // If Gemini found nothing, fall back to patterns
        if (results.length === 0) {
          const { results: patternResults, suggestions } = getPatternResults(termekNev, gyarto);
          return new Response(JSON.stringify({
            found: patternResults.length > 0,
            results: patternResults,
            search_suggestions: suggestions,
            search_type: 'pattern_fallback',
            warning: '⚠️ Gemini keresés nem talált PDF-et. Ezek minta URL-ek - ellenőrizd, hogy léteznek!',
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          found: true,
          results,
          search_type: 'google',
          search_details: searchType === 'manufacturer' ? 'Gyártói oldalról' : 'Általános keresés',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (searchError) {
        console.error('Gemini keresési hiba:', searchError);
        // Fallback URL mintákra ha a keresés sikertelen
        const { results, suggestions } = getPatternResults(termekNev, gyarto);
        return new Response(JSON.stringify({
          found: results.length > 0,
          results,
          search_suggestions: suggestions,
          search_type: 'pattern_fallback',
          warning: '⚠️ Gemini keresés sikertelen. Ezek minta URL-ek.',
          error: searchError instanceof Error ? searchError.message : 'Keresési hiba',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Nincs API kulcs - használjuk a URL mintákat
    const { results, suggestions } = getPatternResults(termekNev, gyarto);

    return new Response(JSON.stringify({
      found: results.length > 0,
      results,
      search_suggestions: suggestions,
      search_type: 'pattern',
      warning: '⚠️ GEMINI_API_KEY nincs beállítva. Ezek csak minta URL-ek. Állítsd be a Cloudflare-ben!',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('PDF keresési hiba:', error);
    return new Response(JSON.stringify({
      found: false,
      results: [],
      search_suggestions: ['Keress manuálisan a gyártó oldalán'],
      error: error instanceof Error ? error.message : 'Keresési hiba'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

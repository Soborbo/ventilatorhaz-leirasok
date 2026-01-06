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
  };
}

// Gyártói URL pattern-ek - fallback ha nincs API kulcs
const MANUFACTURER_PATTERNS: Record<string, {
  baseUrl: string;
  pdfPath: (productName: string) => string[];
  searchUrl: string;
}> = {
  'Elicent': {
    baseUrl: 'https://www.elicent.it',
    pdfPath: (name) => [
      `/download/schede-tecniche/${name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      `/assets/files/${name.toLowerCase()}.pdf`,
    ],
    searchUrl: 'https://www.elicent.it/en/products/',
  },
  'Maico': {
    baseUrl: 'https://www.maico-ventilatoren.com',
    pdfPath: (name) => [
      `/media/pdf/${name.toLowerCase()}.pdf`,
    ],
    searchUrl: 'https://www.maico-ventilatoren.com/products/',
  },
  'Blauberg': {
    baseUrl: 'https://blaubergvento.de',
    pdfPath: (name) => [
      `/upload/files/${name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
    ],
    searchUrl: 'https://blaubergvento.de/en/products/',
  },
  'Vents': {
    baseUrl: 'https://ventilation-system.com',
    pdfPath: (name) => [
      `/upload/medialibrary/${name.toUpperCase()}.pdf`,
      `/products/${name.toLowerCase()}/datasheet.pdf`,
    ],
    searchUrl: 'https://ventilation-system.com/catalog/',
  },
  'Awenta': {
    baseUrl: 'https://www.awenta.pl',
    pdfPath: (name) => [
      `/files/products/${name.toLowerCase()}.pdf`,
    ],
    searchUrl: 'https://www.awenta.pl/en/products/',
  },
  'Helios': {
    baseUrl: 'https://www.heliosventilatoren.de',
    pdfPath: (name) => [
      `/fileadmin/documents/datenblaetter/${name}.pdf`,
    ],
    searchUrl: 'https://www.heliosventilatoren.de/de/produkte/',
  },
  'Vortice': {
    baseUrl: 'https://www.vortice.com',
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
 * Search using Gemini API with Google Search Grounding
 * Prioritizes manufacturer website, then falls back to general search
 */
async function geminiSearch(query: string, gyarto: string, apiKey: string): Promise<PdfResult[]> {
  // Get manufacturer domain if known
  const manufacturerPattern = MANUFACTURER_PATTERNS[gyarto];
  const manufacturerDomain = manufacturerPattern?.baseUrl.replace('https://', '').replace('http://', '') || '';

  const searchPrompt = manufacturerDomain
    ? `Find PDF datasheet for "${query}" ONLY from the manufacturer website: ${manufacturerDomain}

Search specifically on site:${manufacturerDomain} for:
- Official product datasheet PDF
- Technical specifications PDF
- Product documentation PDF

IMPORTANT: Only return URLs from ${manufacturerDomain}.
Return ONLY the PDF URLs you find, one per line. No explanations.`
    : `Find PDF datasheet download links for this ventilator/fan product: "${query}"

Search for official manufacturer PDF datasheets, technical specifications, and product documentation.
Focus on direct .pdf file links from the manufacturer's website.

Return ONLY the URLs you find, one per line. No explanations needed.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: searchPrompt
          }]
        }],
        tools: [{
          googleSearch: {}
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        }
      }),
    }
  );

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  const results: PdfResult[] = [];
  const seenUrls = new Set<string>();

  // Extract URLs from grounding metadata (most reliable)
  const groundingChunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    for (const chunk of groundingChunks) {
      if (chunk.web?.uri && !seenUrls.has(chunk.web.uri)) {
        seenUrls.add(chunk.web.uri);
        results.push({
          url: chunk.web.uri,
          title: chunk.web.title || 'PDF adatlap',
          source: new URL(chunk.web.uri).hostname,
        });
      }
    }
  }

  // Also extract URLs from the text response
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+\.pdf/gi;
  const textUrls = textResponse.match(urlRegex) || [];

  for (const url of textUrls) {
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      try {
        results.push({
          url,
          title: 'PDF adatlap',
          source: new URL(url).hostname,
        });
      } catch {
        // Invalid URL, skip
      }
    }
  }

  return results;
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
        source: `${gyarto} hivatalos oldala (ellenőrizd!)`,
      });
    });

    suggestions.push(
      `Keresd Google-ben: "${gyarto} ${termekNev} datasheet PDF"`,
      `Látogasd meg: ${pattern.searchUrl}`,
      `Próbáld: ${pattern.baseUrl} + termék oldala`,
    );
  } else {
    suggestions.push(
      `Keresd Google-ben: "${gyarto} ${termekNev} datasheet PDF"`,
      `Keresd Google-ben: "${gyarto} ${termekNev} műszaki adatlap"`,
      `Látogasd meg a ${gyarto} hivatalos weboldalát`,
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
        const query = `${gyarto} ${termekNev} datasheet PDF`;
        const results = await geminiSearch(query, gyarto, geminiApiKey);

        return new Response(JSON.stringify({
          found: results.length > 0,
          results,
          search_type: 'google',
          query,
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
          warning: '⚠️ Gemini keresés sikertelen, URL minták alapján keresünk.',
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
      warning: '⚠️ Gemini keresés nincs konfigurálva. Ezek MINTA URL-ek. Állítsd be a GEMINI_API_KEY környezeti változót a valódi kereséshez.',
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

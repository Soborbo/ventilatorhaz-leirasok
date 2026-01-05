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

interface GoogleSearchResult {
  items?: Array<{
    title: string;
    link: string;
    snippet?: string;
    displayLink: string;
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
 * Get API keys from Cloudflare runtime or environment
 */
function getSearchApiKeys(locals: unknown): { googleApiKey?: string; searchEngineId?: string } {
  const runtime = (locals as { runtime?: { env?: { GOOGLE_API_KEY?: string; GOOGLE_SEARCH_ENGINE_ID?: string } } }).runtime;
  return {
    googleApiKey: runtime?.env?.GOOGLE_API_KEY || import.meta.env.GOOGLE_API_KEY,
    searchEngineId: runtime?.env?.GOOGLE_SEARCH_ENGINE_ID || import.meta.env.GOOGLE_SEARCH_ENGINE_ID,
  };
}

/**
 * Search using Google Custom Search API
 */
async function googleSearch(query: string, apiKey: string, searchEngineId: string): Promise<PdfResult[]> {
  const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
  searchUrl.searchParams.set('key', apiKey);
  searchUrl.searchParams.set('cx', searchEngineId);
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('num', '10');
  // Filter for PDF files
  searchUrl.searchParams.set('fileType', 'pdf');

  const response = await fetch(searchUrl.toString());
  const data: GoogleSearchResult = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  if (!data.items || data.items.length === 0) {
    return [];
  }

  return data.items.map(item => ({
    url: item.link,
    title: item.title,
    source: item.displayLink,
    snippet: item.snippet,
  }));
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

    const { googleApiKey, searchEngineId } = getSearchApiKeys(locals);

    // Ha van API kulcs, használjuk a valódi Google keresést
    if (googleApiKey && searchEngineId) {
      try {
        const query = `${gyarto} ${termekNev} datasheet PDF`;
        const results = await googleSearch(query, googleApiKey, searchEngineId);

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
        console.error('Google keresési hiba:', searchError);
        // Fallback URL mintákra ha a keresés sikertelen
        const { results, suggestions } = getPatternResults(termekNev, gyarto);
        return new Response(JSON.stringify({
          found: results.length > 0,
          results,
          search_suggestions: suggestions,
          search_type: 'pattern_fallback',
          warning: '⚠️ Google keresés sikertelen, URL minták alapján keresünk.',
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
      warning: '⚠️ Google keresés nincs konfigurálva. Ezek MINTA URL-ek a gyártó ismert struktúrája alapján. Állítsd be a GOOGLE_API_KEY és GOOGLE_SEARCH_ENGINE_ID környezeti változókat a valódi kereséshez.',
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

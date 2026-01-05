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
}

// Gyártói URL pattern-ek - ezek valódi, ismert URL struktúrák
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

export const POST: APIRoute = async ({ request }) => {
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

    const results: PdfResult[] = [];
    const searchSuggestions: string[] = [];

    // Ha ismerjük a gyártót, adjunk URL javaslatokat
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

      searchSuggestions.push(
        `Keresd Google-ben: "${gyarto} ${termekNev} datasheet PDF"`,
        `Látogasd meg: ${pattern.searchUrl}`,
        `Próbáld: ${pattern.baseUrl} + termék oldala`,
      );
    } else {
      // Ismeretlen gyártó
      searchSuggestions.push(
        `Keresd Google-ben: "${gyarto} ${termekNev} datasheet PDF"`,
        `Keresd Google-ben: "${gyarto} ${termekNev} műszaki adatlap"`,
        `Látogasd meg a ${gyarto} hivatalos weboldalát`,
      );
    }

    return new Response(JSON.stringify({
      found: results.length > 0,
      results,
      search_suggestions: searchSuggestions,
      warning: '⚠️ Ezek MINTA URL-ek a gyártó ismert struktúrája alapján. Ellenőrizd, hogy léteznek-e! A legjobb ha magad keresed meg a PDF-et a gyártó oldalán.',
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

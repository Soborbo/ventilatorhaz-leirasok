import type { APIRoute } from 'astro';

export const prerender = false;

interface ImageSearchRequest {
  termekNev: string;
  gyarto: string;
}

interface ProductImage {
  url: string;
  title: string;
  source: string;
  type: 'product' | 'installation' | 'technical' | 'lifestyle';
}

// Gyártói képek tipikus URL mintái
const MANUFACTURER_IMAGE_PATTERNS: Record<string, {
  domain: string;
  imagePatterns: string[];
}> = {
  'Elicent': {
    domain: 'elicent.it',
    imagePatterns: [
      '/content/uploads/',
      '/wp-content/uploads/',
      '/images/products/',
    ],
  },
  'Maico': {
    domain: 'maico-ventilatoren.com',
    imagePatterns: [
      '/media/image/',
      '/product-images/',
    ],
  },
  'Blauberg': {
    domain: 'blaubergvento.de',
    imagePatterns: [
      '/upload/',
      '/images/',
    ],
  },
  'Vents': {
    domain: 'ventilation-system.com',
    imagePatterns: [
      '/upload/',
      '/images/',
    ],
  },
  'Vortice': {
    domain: 'vortice.com',
    imagePatterns: [
      '/media/',
      '/images/',
    ],
  },
};

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: {
          uri?: string;
          title?: string;
        };
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

function getGeminiApiKey(locals: unknown): string | undefined {
  const runtime = (locals as { runtime?: { env?: { GEMINI_API_KEY?: string } } }).runtime;
  return runtime?.env?.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
}

function isGoogleRedirectUrl(url: string): boolean {
  return url.includes('vertexaisearch.cloud.google.com/grounding-api-redirect');
}

async function resolveRedirectUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
    });
    const location = response.headers.get('location');
    if (location) return location;

    const getResponse = await fetch(url, { redirect: 'manual' });
    const getLocation = getResponse.headers.get('location');
    if (getLocation) return getLocation;

    return url;
  } catch {
    return url;
  }
}

async function searchImagesWithGemini(
  termekNev: string,
  gyarto: string,
  apiKey: string
): Promise<ProductImage[]> {
  const pattern = MANUFACTURER_IMAGE_PATTERNS[gyarto];
  const domain = pattern?.domain || `${gyarto.toLowerCase()}.com`;

  const searchPrompt = `Search for product images of "${gyarto} ${termekNev}" ventilator/fan.

Find HIGH QUALITY product images from:
1. Official manufacturer website (${domain}) - MOST IMPORTANT
2. Product datasheets and catalogs
3. Professional product photography

Look for:
- Main product photo (white background, clear view)
- Installation photos showing the product mounted
- Technical diagrams or dimensional drawings
- Application/lifestyle images showing the product in use

Return image URLs you find. Prefer .jpg, .png, .webp files.
Focus on OFFICIAL manufacturer images, not reseller photos.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: searchPrompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    const data: GeminiResponse = await response.json();

    if (data.error) {
      console.error('Gemini image search error:', data.error);
      return [];
    }

    const images: ProductImage[] = [];
    const seenUrls = new Set<string>();

    // Extract from grounding chunks
    const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    for (const chunk of chunks) {
      let uri = chunk.web?.uri;
      if (!uri) continue;

      // Resolve Google redirects
      if (isGoogleRedirectUrl(uri)) {
        uri = await resolveRedirectUrl(uri);
      }

      // Check if it's an image URL
      const lowerUri = uri.toLowerCase();
      const isImage = lowerUri.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i) ||
                     lowerUri.includes('/image') ||
                     lowerUri.includes('/photo') ||
                     lowerUri.includes('/media');

      if (isImage && !seenUrls.has(uri)) {
        seenUrls.add(uri);
        const hostname = new URL(uri).hostname;
        const isManufacturer = hostname.includes(domain);

        images.push({
          url: uri,
          title: chunk.web?.title || 'Termék kép',
          source: hostname,
          type: categorizeImage(uri, chunk.web?.title || ''),
        });
      }
    }

    // Also extract image URLs from text response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const imageUrlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]()]+\.(jpg|jpeg|png|webp|gif)(\?[^\s]*)?/gi;
    const textUrls = textResponse.match(imageUrlRegex) || [];

    for (const url of textUrls) {
      const cleanUrl = url.replace(/[.,;:!?)]+$/, '');
      if (!seenUrls.has(cleanUrl)) {
        seenUrls.add(cleanUrl);
        try {
          const hostname = new URL(cleanUrl).hostname;
          images.push({
            url: cleanUrl,
            title: 'Termék kép',
            source: hostname,
            type: categorizeImage(cleanUrl, ''),
          });
        } catch {
          // Invalid URL
        }
      }
    }

    // Sort: manufacturer first
    images.sort((a, b) => {
      const aIsManufacturer = a.source.includes(domain) ? 0 : 1;
      const bIsManufacturer = b.source.includes(domain) ? 0 : 1;
      return aIsManufacturer - bIsManufacturer;
    });

    return images;
  } catch (err) {
    console.error('Image search failed:', err);
    return [];
  }
}

function categorizeImage(url: string, title: string): ProductImage['type'] {
  const lower = (url + ' ' + title).toLowerCase();

  if (lower.includes('install') || lower.includes('mount') || lower.includes('szerel')) {
    return 'installation';
  }
  if (lower.includes('dimension') || lower.includes('technical') || lower.includes('diagram') || lower.includes('műszaki')) {
    return 'technical';
  }
  if (lower.includes('room') || lower.includes('interior') || lower.includes('application') || lower.includes('szoba')) {
    return 'lifestyle';
  }
  return 'product';
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body: ImageSearchRequest = await request.json();
    const { termekNev, gyarto } = body;

    if (!termekNev || !gyarto) {
      return new Response(JSON.stringify({
        error: 'Hiányzó mezők: termekNev, gyarto',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const geminiApiKey = getGeminiApiKey(locals);

    if (!geminiApiKey) {
      // Fallback: return pattern-based suggestions
      const pattern = MANUFACTURER_IMAGE_PATTERNS[gyarto];
      return new Response(JSON.stringify({
        found: false,
        images: [],
        suggestions: pattern ? [
          `Keress a gyártó oldalán: https://${pattern.domain}`,
          `Google képkereső: "${gyarto} ${termekNev}" site:${pattern.domain}`,
        ] : [
          `Google képkereső: "${gyarto} ${termekNev}" product image`,
        ],
        warning: 'GEMINI_API_KEY nincs beállítva',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const images = await searchImagesWithGemini(termekNev, gyarto, geminiApiKey);

    return new Response(JSON.stringify({
      found: images.length > 0,
      images,
      image_count: images.length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Image search error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Képkeresési hiba',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

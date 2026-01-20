import type { APIRoute } from 'astro';

export const prerender = false;

interface BatchSearchRequest {
  products: Array<{
    name: string;
    manufacturer: string;
  }>;
}

interface ProductLinkResult {
  productName: string;
  manufacturer: string;
  productLine: string;
  links: Array<{
    url: string;
    title: string;
    domain: string;
    type: 'pdf' | 'page';
  }>;
  success: boolean;
  error?: string;
}

interface BatchSearchResponse {
  totalProducts: number;
  successCount: number;
  failureCount: number;
  results: ProductLinkResult[];
}

/**
 * Extract product line from product name
 * Examples:
 *   "ELIX 100" -> "ELIX"
 *   "ER 100 VFL" -> "ER"
 *   "MiniVent M1/100" -> "MiniVent M1"
 */
function extractProductLine(productName: string): string {
  // Remove common suffixes and numbers at the end
  const cleaned = productName
    .replace(/\s+\d+[\w\/\-]*$/i, '') // Remove trailing numbers with modifiers
    .replace(/\s+(VFL|HTM|S|T|P)$/i, '') // Remove common suffixes
    .trim();

  // If we removed too much, return first word
  if (!cleaned) {
    return productName.split(/\s+/)[0];
  }

  return cleaned;
}

/**
 * Get domain from URL
 */
function getDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/**
 * Get Gemini API key
 */
function getGeminiApiKey(locals: unknown): string | undefined {
  const runtime = (locals as { runtime?: { env?: { GEMINI_API_KEY?: string } } }).runtime;
  return runtime?.env?.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
}

/**
 * Resolve redirect URL
 */
async function resolveRedirectUrl(url: string): Promise<string> {
  if (!url.includes('vertexaisearch.cloud.google.com/grounding-api-redirect')) {
    return url;
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
    });

    const location = response.headers.get('location');
    if (location) {
      return location;
    }

    return url;
  } catch (error) {
    return url;
  }
}

/**
 * Search for product line datasheet using Gemini API
 */
async function searchProductLineLinks(
  productName: string,
  productLine: string,
  manufacturer: string,
  apiKey: string
): Promise<ProductLinkResult['links']> {
  const searchPrompt = `Find the official product datasheet for the ${productLine} product line/series by ${manufacturer}.

This is a ventilator/fan product. The specific model is ${productName}, but I need the product line/series datasheet that covers multiple models in the ${productLine} series.

Find EXACTLY 3 links from the manufacturer's official website:
1. PDF product line datasheet/catalog (most important - this should cover the entire ${productLine} series, not just one model)
2. Product line page on manufacturer's website
3. Related documentation or catalog

Requirements:
- All links MUST be from ${manufacturer}'s official domain
- Prefer English or Hungarian language pages
- Look for series/line datasheets, not individual product datasheets

Provide the URLs you find.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: searchPrompt }]
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

    const data = await response.json();

    if (data.error) {
      console.error(`Gemini API error for ${productName}:`, data.error);
      return [];
    }

    const foundLinks: ProductLinkResult['links'] = [];
    const seenUrls = new Set<string>();

    // Extract from grounding metadata
    const groundingChunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    for (const chunk of groundingChunks) {
      const uri = chunk.web?.uri;
      if (uri && !seenUrls.has(uri)) {
        const resolvedUrl = await resolveRedirectUrl(uri);

        if (!seenUrls.has(resolvedUrl)) {
          seenUrls.add(resolvedUrl);

          const isPdf = resolvedUrl.toLowerCase().includes('.pdf');
          const domain = getDomain(resolvedUrl);

          foundLinks.push({
            url: resolvedUrl,
            title: chunk.web?.title || 'Találat',
            domain,
            type: isPdf ? 'pdf' : 'page',
          });
        }
      }
    }

    // Extract from text response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]()]+/gi;
    const textUrls = textResponse.match(urlRegex) || [];

    for (const url of textUrls) {
      const cleanUrl = url.replace(/[.,;:!?)]+$/, '');

      if (!seenUrls.has(cleanUrl)) {
        seenUrls.add(cleanUrl);

        const isPdf = cleanUrl.toLowerCase().includes('.pdf');
        const domain = getDomain(cleanUrl);

        foundLinks.push({
          url: cleanUrl,
          title: 'Találat',
          domain,
          type: isPdf ? 'pdf' : 'page',
        });
      }
    }

    // Sort: PDFs first, then pages
    foundLinks.sort((a, b) => {
      if (a.type === 'pdf' && b.type !== 'pdf') return -1;
      if (a.type !== 'pdf' && b.type === 'pdf') return 1;
      return 0;
    });

    // Return top 3
    return foundLinks.slice(0, 3);
  } catch (error) {
    console.error(`Search failed for ${productName}:`, error);
    return [];
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body: BatchSearchRequest = await request.json();
    const { products } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify({
        error: 'Hiányzó vagy hibás termékek lista'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for Gemini API key
    const geminiApiKey = getGeminiApiKey(locals);
    if (!geminiApiKey) {
      return new Response(JSON.stringify({
        error: 'GEMINI_API_KEY nincs beállítva. Batch keresés csak Gemini API-val működik.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Batch search started for ${products.length} products`);

    const results: ProductLinkResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      if (!product.name || !product.manufacturer) {
        failureCount++;
        results.push({
          productName: product.name || '',
          manufacturer: product.manufacturer || '',
          productLine: '',
          links: [],
          success: false,
          error: 'Hiányzó terméknév vagy gyártó',
        });
        continue;
      }

      console.log(`[${i + 1}/${products.length}] Searching: ${product.manufacturer} ${product.name}`);

      // Extract product line
      const productLine = extractProductLine(product.name);
      console.log(`  Product line: ${productLine}`);

      try {
        // Search for links
        const links = await searchProductLineLinks(
          product.name,
          productLine,
          product.manufacturer,
          geminiApiKey
        );

        if (links.length > 0) {
          successCount++;
          console.log(`  ✅ Found ${links.length} links`);
        } else {
          failureCount++;
          console.log(`  ⚠️  No links found`);
        }

        results.push({
          productName: product.name,
          manufacturer: product.manufacturer,
          productLine,
          links,
          success: links.length > 0,
        });

        // Rate limiting: 1 request per second
        if (i < products.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        failureCount++;
        console.error(`  ❌ Error:`, error);

        results.push({
          productName: product.name,
          manufacturer: product.manufacturer,
          productLine,
          links: [],
          success: false,
          error: error instanceof Error ? error.message : 'Keresési hiba',
        });
      }
    }

    const response: BatchSearchResponse = {
      totalProducts: products.length,
      successCount,
      failureCount,
      results,
    };

    console.log(`Batch search completed: ${successCount}/${products.length} success`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Batch search error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Batch keresési hiba'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

#!/usr/bin/env node

/**
 * Product Link Collector
 *
 * Egyszerű script ami terméklistából PDF datasheet és gyártói oldal linkeket gyűjt.
 *
 * Input: products.txt fájl, soronként "Termék Név | Gyártó" formátumban
 * Output: product-links.json fájl a talált linkekkel
 */

import * as fs from 'fs';
import * as path from 'path';

interface ProductInput {
  name: string;
  manufacturer: string;
}

interface ProductLinks {
  product: string;
  manufacturer: string;
  pdfLinks: string[];
  manufacturerPageLinks: string[];
  timestamp: string;
}

interface CollectionResult {
  totalProducts: number;
  successCount: number;
  failureCount: number;
  products: ProductLinks[];
  generatedAt: string;
}

// Gyártói URL pattern-ek
const MANUFACTURER_PATTERNS: Record<string, {
  baseUrl: string;
  domain: string;
  pdfPath: (productName: string) => string[];
  productPageUrl: (productName: string) => string;
}> = {
  'Elicent': {
    baseUrl: 'https://www.elicent.it',
    domain: 'elicent.it',
    pdfPath: (name) => {
      const cleanName = name.toUpperCase().replace(/\s+/g, '-');
      return [
        `/content/uploads/2024/${cleanName}.pdf`,
        `/content/uploads/2023/${cleanName}.pdf`,
        `/content/uploads/2022/${cleanName}.pdf`,
        `/content/uploads/2021/${cleanName}.pdf`,
        `/content/uploads/2020/${cleanName}.pdf`,
        `/content/uploads/2019/${cleanName}.pdf`,
        `/content/uploads/2018/04/${cleanName}-16-5-18.pdf`,
        `/download/schede-tecniche/${name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      ];
    },
    productPageUrl: (name) => `https://www.elicent.it/en/products/?s=${encodeURIComponent(name)}`,
  },
  'Maico': {
    baseUrl: 'https://www.maico-ventilatoren.com',
    domain: 'maico-ventilatoren.com',
    pdfPath: (name) => [
      `/media/pdf/${name.toLowerCase()}.pdf`,
      `/media/downloads/${name.toLowerCase()}.pdf`,
    ],
    productPageUrl: (name) => `https://www.maico-ventilatoren.com/en/products/?search=${encodeURIComponent(name)}`,
  },
  'Blauberg': {
    baseUrl: 'https://blaubergvento.de',
    domain: 'blaubergvento.de',
    pdfPath: (name) => [
      `/upload/files/${name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      `/files/products/${name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
    ],
    productPageUrl: (name) => `https://blaubergvento.de/en/search/?q=${encodeURIComponent(name)}`,
  },
  'Vents': {
    baseUrl: 'https://ventilation-system.com',
    domain: 'ventilation-system.com',
    pdfPath: (name) => [
      `/upload/medialibrary/${name.toUpperCase()}.pdf`,
      `/products/${name.toLowerCase()}/datasheet.pdf`,
      `/files/${name.toUpperCase()}.pdf`,
    ],
    productPageUrl: (name) => `https://ventilation-system.com/catalog/?q=${encodeURIComponent(name)}`,
  },
  'Awenta': {
    baseUrl: 'https://www.awenta.pl',
    domain: 'awenta.pl',
    pdfPath: (name) => [
      `/files/products/${name.toLowerCase()}.pdf`,
      `/media/products/${name.toLowerCase()}.pdf`,
    ],
    productPageUrl: (name) => `https://www.awenta.pl/en/products/?search=${encodeURIComponent(name)}`,
  },
  'Helios': {
    baseUrl: 'https://www.heliosventilatoren.de',
    domain: 'heliosventilatoren.de',
    pdfPath: (name) => [
      `/fileadmin/documents/datenblaetter/${name}.pdf`,
      `/fileadmin/downloads/${name}.pdf`,
    ],
    productPageUrl: (name) => `https://www.heliosventilatoren.de/de/produkte/?search=${encodeURIComponent(name)}`,
  },
  'Vortice': {
    baseUrl: 'https://www.vortice.com',
    domain: 'vortice.com',
    pdfPath: (name) => [
      `/media/products/${name.toLowerCase()}.pdf`,
      `/downloads/${name.toLowerCase()}.pdf`,
    ],
    productPageUrl: (name) => `https://www.vortice.com/search/?q=${encodeURIComponent(name)}`,
  },
};

/**
 * Check if URL is accessible (via HEAD request)
 */
async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    return response.ok; // 200-299 status codes
  } catch (error) {
    return false;
  }
}

/**
 * Call Gemini API with search grounding to find PDFs and product pages
 */
async function searchWithGemini(productName: string, manufacturer: string, apiKey: string): Promise<{ pdfLinks: string[], pageLinks: string[] }> {
  const searchPrompt = `Keress információt erről a termékről: ${manufacturer} ${productName}

Két dolgot keress:
1. PDF adatlap (datasheet) - hivatalos gyártói PDF dokumentum
2. A termék oldala a gyártó weboldalán

Add meg a talált URL-eket.`;

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
      console.error(`Gemini API hiba (${productName}):`, data.error);
      return { pdfLinks: [], pageLinks: [] };
    }

    const pdfLinks = new Set<string>();
    const pageLinks = new Set<string>();

    // Extract from grounding metadata
    const groundingChunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    for (const chunk of groundingChunks) {
      const uri = chunk.web?.uri;
      if (uri) {
        // Resolve redirects
        const resolvedUrl = await resolveRedirectUrl(uri);

        if (resolvedUrl.toLowerCase().includes('.pdf')) {
          pdfLinks.add(resolvedUrl);
        } else {
          pageLinks.add(resolvedUrl);
        }
      }
    }

    // Extract from text response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]()]+/gi;
    const textUrls = textResponse.match(urlRegex) || [];

    for (const url of textUrls) {
      const cleanUrl = url.replace(/[.,;:!?)]+$/, '');

      if (cleanUrl.toLowerCase().includes('.pdf')) {
        pdfLinks.add(cleanUrl);
      } else {
        pageLinks.add(cleanUrl);
      }
    }

    return {
      pdfLinks: Array.from(pdfLinks),
      pageLinks: Array.from(pageLinks),
    };
  } catch (error) {
    console.error(`Gemini keresés sikertelen (${productName}):`, error);
    return { pdfLinks: [], pageLinks: [] };
  }
}

/**
 * Resolve redirect URL to actual destination
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
 * Get links using URL patterns (fallback when no API key)
 */
function getLinksFromPatterns(productName: string, manufacturer: string): { pdfLinks: string[], pageLinks: string[] } {
  const pattern = MANUFACTURER_PATTERNS[manufacturer];

  if (!pattern) {
    console.warn(`Nincs pattern ${manufacturer} gyártóhoz - Google kereséssel próbálkozz.`);
    return { pdfLinks: [], pageLinks: [] };
  }

  const pdfPaths = pattern.pdfPath(productName);
  const pdfLinks = pdfPaths.map(path => `${pattern.baseUrl}${path}`);
  const pageLinks = [pattern.productPageUrl(productName)];

  return { pdfLinks, pageLinks };
}

/**
 * Collect links for a single product
 */
async function collectProductLinks(product: ProductInput, geminiApiKey?: string): Promise<ProductLinks> {
  console.log(`\n🔍 Keresés: ${product.manufacturer} ${product.name}`);

  let pdfLinks: string[] = [];
  let pageLinks: string[] = [];

  // Try Gemini API first if available
  if (geminiApiKey) {
    console.log('  📡 Gemini API keresés...');
    const geminiResults = await searchWithGemini(product.name, product.manufacturer, geminiApiKey);
    pdfLinks = geminiResults.pdfLinks;
    pageLinks = geminiResults.pageLinks;

    if (pdfLinks.length > 0 || pageLinks.length > 0) {
      console.log(`  ✅ Találat: ${pdfLinks.length} PDF, ${pageLinks.length} oldal`);
    } else {
      console.log('  ⚠️  Gemini nem talált semmit, URL pattern próba...');
    }
  }

  // Fallback to patterns if Gemini found nothing or no API key
  if (pdfLinks.length === 0 && pageLinks.length === 0) {
    console.log('  🔗 URL pattern alapú linkek...');
    const patternResults = getLinksFromPatterns(product.name, product.manufacturer);
    pdfLinks = patternResults.pdfLinks;
    pageLinks = patternResults.pageLinks;

    if (pdfLinks.length > 0 || pageLinks.length > 0) {
      console.log(`  📝 Generált: ${pdfLinks.length} PDF URL, ${pageLinks.length} oldal URL`);
      console.log('  ⚠️  Ezek NEM ellenőrzött linkek - lehet hogy nem léteznek!');
    }
  }

  return {
    product: product.name,
    manufacturer: product.manufacturer,
    pdfLinks,
    manufacturerPageLinks: pageLinks,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Parse input file and extract products
 */
function parseProductsFile(filePath: string): ProductInput[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  const products: ProductInput[] = [];

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) {
      continue;
    }

    // Expected format: "Product Name | Manufacturer"
    const parts = line.split('|').map(p => p.trim());

    if (parts.length >= 2) {
      products.push({
        name: parts[0],
        manufacturer: parts[1],
      });
    } else {
      console.warn(`⚠️  Hibás sor (hiányzó gyártó?): ${line}`);
    }
  }

  return products;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const inputFile = args[0] || 'products.txt';
  const outputFile = args[1] || 'product-links.json';

  console.log('🚀 Product Link Collector');
  console.log('=========================\n');

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Hiba: ${inputFile} nem található!`);
    console.log('\nHozz létre egy products.txt fájlt a következő formátumban:');
    console.log('  ELIX 100 | Elicent');
    console.log('  ER 100 | Maico');
    console.log('  ...\n');
    process.exit(1);
  }

  // Parse products
  const products = parseProductsFile(inputFile);
  console.log(`📋 ${products.length} termék betöltve a ${inputFile} fájlból\n`);

  if (products.length === 0) {
    console.error('❌ Nincs termék a fájlban!');
    process.exit(1);
  }

  // Check for Gemini API key
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    console.log('✅ GEMINI_API_KEY megtalálva - Google keresés engedélyezve\n');
  } else {
    console.log('⚠️  GEMINI_API_KEY nincs beállítva - csak URL pattern-ek\n');
    console.log('   Állítsd be: export GEMINI_API_KEY="your-key-here"\n');
  }

  // Collect links for all products
  const results: ProductLinks[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`[${i + 1}/${products.length}]`);

    try {
      const links = await collectProductLinks(product, geminiApiKey);
      results.push(links);

      if (links.pdfLinks.length > 0 || links.manufacturerPageLinks.length > 0) {
        successCount++;
      } else {
        failureCount++;
      }

      // Rate limit for API calls (1 request per second)
      if (geminiApiKey && i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`  ❌ Hiba történt: ${error}`);
      failureCount++;
      results.push({
        product: product.name,
        manufacturer: product.manufacturer,
        pdfLinks: [],
        manufacturerPageLinks: [],
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Save results
  const finalResult: CollectionResult = {
    totalProducts: products.length,
    successCount,
    failureCount,
    products: results,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(outputFile, JSON.stringify(finalResult, null, 2), 'utf-8');

  // Summary
  console.log('\n\n📊 Összegzés');
  console.log('============');
  console.log(`Összes termék: ${finalResult.totalProducts}`);
  console.log(`Sikeres:      ${successCount} (${Math.round(successCount / products.length * 100)}%)`);
  console.log(`Sikertelen:   ${failureCount}`);
  console.log(`\n💾 Eredmény mentve: ${outputFile}\n`);
}

// Run
main().catch(error => {
  console.error('❌ Kritikus hiba:', error);
  process.exit(1);
});

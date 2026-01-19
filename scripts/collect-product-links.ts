#!/usr/bin/env node

/**
 * Product Link Collector
 *
 * Gyűjt 3 linket minden termékhez a gyártói oldalról Gemini API segítségével.
 *
 * Input: products.txt fájl, soronként "Termék Név | Gyártó" formátumban
 * Output: product-links.json fájl a talált linkekkel
 *
 * FONTOS: GEMINI_API_KEY környezeti változó szükséges!
 */

import * as fs from 'fs';

interface ProductInput {
  name: string;
  manufacturer: string;
}

interface ProductLinks {
  product: string;
  manufacturer: string;
  links: Array<{
    url: string;
    title: string;
    type: 'pdf' | 'page';
  }>;
  timestamp: string;
}

interface CollectionResult {
  totalProducts: number;
  successCount: number;
  failureCount: number;
  products: ProductLinks[];
  generatedAt: string;
}

/**
 * Call Gemini API with search grounding to find 3 links from manufacturer's website
 */
async function searchWithGemini(productName: string, manufacturer: string, apiKey: string): Promise<ProductLinks['links']> {
  const searchPrompt = `Find information about this ventilator/fan product: ${manufacturer} ${productName}

Your task:
1. Find EXACTLY 3 links from the manufacturer's official website
2. Prioritize:
   - PDF datasheet/technical specification (most important)
   - Product page on manufacturer's website
   - Related documentation or installation guide

Requirements:
- All links MUST be from the manufacturer's official domain
- Prefer English or Hungarian language pages
- Return the 3 most relevant links

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
      console.error(`  ❌ Gemini API hiba: ${data.error.message}`);
      return [];
    }

    const foundLinks: ProductLinks['links'] = [];
    const seenUrls = new Set<string>();

    // Extract from grounding metadata
    const groundingChunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    for (const chunk of groundingChunks) {
      const uri = chunk.web?.uri;
      if (uri && !seenUrls.has(uri)) {
        const resolvedUrl = await resolveRedirectUrl(uri);

        if (!seenUrls.has(resolvedUrl)) {
          seenUrls.add(resolvedUrl);

          // Determine type
          const isPdf = resolvedUrl.toLowerCase().includes('.pdf');

          foundLinks.push({
            url: resolvedUrl,
            title: chunk.web?.title || 'Találat',
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

        foundLinks.push({
          url: cleanUrl,
          title: 'Találat',
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
    console.error(`  ❌ Gemini keresés sikertelen:`, error);
    return [];
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
 * Collect links for a single product
 */
async function collectProductLinks(product: ProductInput, geminiApiKey: string): Promise<ProductLinks> {
  console.log(`\n🔍 Keresés: ${product.manufacturer} ${product.name}`);
  console.log('  📡 Gemini API keresés (3 link gyártói oldalról)...');

  const links = await searchWithGemini(product.name, product.manufacturer, geminiApiKey);

  if (links.length > 0) {
    console.log(`  ✅ Találat: ${links.length} link`);
    links.forEach((link, i) => {
      const icon = link.type === 'pdf' ? '📄' : '🔗';
      console.log(`     ${icon} ${link.url}`);
    });
  } else {
    console.log(`  ⚠️  Nincs találat`);
  }

  return {
    product: product.name,
    manufacturer: product.manufacturer,
    links,
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

  // Check for Gemini API key
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('❌ HIBA: GEMINI_API_KEY környezeti változó nincs beállítva!\n');
    console.log('Állítsd be:');
    console.log('  export GEMINI_API_KEY="your-key-here"\n');
    console.log('API kulcs beszerzése:');
    console.log('  https://aistudio.google.com/apikey\n');
    process.exit(1);
  }

  console.log('✅ GEMINI_API_KEY megtalálva\n');

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

      if (links.links.length > 0) {
        successCount++;
      } else {
        failureCount++;
      }

      // Rate limit for API calls (1 request per second)
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`  ❌ Hiba történt: ${error}`);
      failureCount++;
      results.push({
        product: product.name,
        manufacturer: product.manufacturer,
        links: [],
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

import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

interface AnalyzeRequest {
  termekNev: string;
  gyarto: string;
  kategoria: string;
  extractedData?: Record<string, unknown>;
}

/**
 * Extract size (diameter) from product name or data
 * Examples: "AXC 100" -> 100, "Elix 150T" -> 150
 */
function extractSizeFromProduct(termekNev: string, extractedData?: Record<string, unknown>): number | null {
  // First check extractedData for csoatmero_mm
  if (extractedData?.csoatmero_mm) {
    return Number(extractedData.csoatmero_mm);
  }

  // Try to extract from product name - look for common patterns
  // Pattern: numbers like 100, 125, 150, 160, 200, 250, 315, 400
  const sizeMatch = termekNev.match(/\b(80|100|120|125|150|160|200|250|315|350|400|450|500)\b/);
  if (sizeMatch) {
    return parseInt(sizeMatch[1], 10);
  }

  return null;
}

// Manufacturer domains for prioritization
const MANUFACTURER_DOMAINS: Record<string, string[]> = {
  'Elicent': ['elicent.it', 'elicent.com'],
  'Maico': ['maico-ventilatoren.com', 'maico.de'],
  'Blauberg': ['blaubergvento.de', 'blauberg.de', 'blaubergvento.com'],
  'Vents': ['ventilation-system.com', 'vents.ua', 'vents.eu'],
  'Awenta': ['awenta.pl', 'awenta.com'],
  'Helios': ['heliosventilatoren.de', 'helios.de'],
  'Vortice': ['vortice.com', 'vortice.it'],
};

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const apiKey = runtime?.env?.ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'ANTHROPIC_API_KEY nincs beállítva'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const client = new Anthropic({ apiKey });

  try {
    const body: AnalyzeRequest = await request.json();
    const { termekNev, gyarto, kategoria, extractedData } = body;

    if (!termekNev || !gyarto) {
      return new Response(JSON.stringify({
        error: 'Hiányzó mezők: termekNev, gyarto'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract product size for fair comparison
    const productSize = extractSizeFromProduct(termekNev, extractedData);
    const sizeContext = productSize
      ? `\nEz egy ${productSize}mm csőátmérőjű ventilátor. Csak azonos méretű (${productSize}mm) termékeket hasonlíts!`
      : '';

    // Get manufacturer domains
    const manufacturerDomains = MANUFACTURER_DOMAINS[gyarto] || [];
    const manufacturerSites = manufacturerDomains.length > 0
      ? manufacturerDomains.join(', ')
      : `${gyarto.toLowerCase()}.com, ${gyarto.toLowerCase()}.it, ${gyarto.toLowerCase()}.de`;

    // === LÉPÉS 1: Gyártói információk (LEGFONTOSABB) ===
    const manufacturerPrompt = `Keresd meg a "${gyarto} ${termekNev}" termék HIVATALOS gyártói leírását!

KERESS EZEKEN AZ OLDALAKON (fontossági sorrendben):
1. ${manufacturerSites} - A GYÁRTÓ HIVATALOS OLDALA (LEGFONTOSABB!)
2. A gyártó PDF adatlapja és katalógusa

MIT KERESS:
- Hogyan írja le a GYÁRTÓ a saját termékét?
- Milyen előnyöket, USP-ket emel ki a gyártó?
- Milyen célcsoportnak ajánlja?
- Milyen technológiákat/funkciókat hangsúlyoz?
${sizeContext}

FONTOS: A gyártó saját szavait és marketingjét keresd, ne te találd ki!

VÁLASZOLJ JSON FORMÁTUMBAN:
{
  "manufacturer_usps": [
    {
      "usp_text": "A gyártó által használt pontos USP/előny szöveg",
      "context": "Hol találtad (termékoldal/katalógus/adatlap)",
      "original_language": "eredeti nyelv ha nem magyar"
    }
  ],
  "manufacturer_highlights": ["gyártó által kiemelt fő tulajdonságok"],
  "target_audience": "A gyártó szerint kinek ajánlott",
  "key_technologies": ["említett technológiák/funkciók"],
  "source_urls": ["url ahol találtad"]
}`;

    const manufacturerResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: manufacturerPrompt }],
    });

    const manufacturerText = manufacturerResponse.content[0].type === 'text' ? manufacturerResponse.content[0].text : '';

    let manufacturerData: any = {};
    try {
      const jsonMatch = manufacturerText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        manufacturerData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      manufacturerData = { raw: manufacturerText };
    }

    // === LÉPÉS 2: Más forgalmazók USP-i ===
    const competitorPrompt = `Keresd meg hogyan árulják MÁSOK a "${gyarto} ${termekNev}" terméket!

KERESS EZEKEN AZ OLDALAKON:
1. Magyar webshopok: szelep.hu, szelloztetes.hu, ventilator.hu, praktiker.hu, obi.hu, bauhaus.hu
2. Nemzetközi webshopok: amazon.de, ebay.de, conrad.de
3. Szakmai fórumok, vélemények

MIT KERESS:
- Milyen USP-ket/előnyöket használnak a forgalmazók?
- Hogyan pozicionálják a terméket?
- Mit emelnek ki a termékleírásokban?
- Milyen vásárlói vélemények vannak?
${sizeContext}

FONTOS: A TÉNYLEGES forgalmazói szövegeket gyűjtsd, ne te találd ki!

VÁLASZOLJ JSON FORMÁTUMBAN:
{
  "seller_usps": [
    {
      "source": "webshop/oldal neve",
      "usp_text": "Az általuk használt USP/leírás",
      "selling_angle": "milyen szemszögből adják el"
    }
  ],
  "common_selling_points": ["több helyen is előforduló érvek"],
  "unique_angles": ["egyedi megközelítések amit találtál"],
  "customer_feedback": ["vásárlói vélemények összefoglalása"]
}`;

    const competitorResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: competitorPrompt }],
    });

    const competitorText = competitorResponse.content[0].type === 'text' ? competitorResponse.content[0].text : '';

    let competitorData: any = {};
    try {
      const jsonMatch = competitorText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        competitorData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      competitorData = { raw: competitorText };
    }

    // === LÉPÉS 3: USP javaslatok összeállítása A TALÁLT ADATOK ALAPJÁN ===
    const sizeUspContext = productSize
      ? `\nMÉRET: ${productSize}mm - minden összehasonlítás csak erre a méretre vonatkozzon!`
      : '';

    const uspPrompt = `A "${gyarto} ${termekNev}" termékhez készíts USP javaslatokat AZ ALÁBBI KUTATÁS ALAPJÁN.

=== GYÁRTÓI INFORMÁCIÓK (LEGFONTOSABB FORRÁS) ===
${JSON.stringify(manufacturerData, null, 2)}

=== MÁS FORGALMAZÓK USP-I ===
${JSON.stringify(competitorData, null, 2)}

=== MŰSZAKI ADATOK ===
${extractedData ? JSON.stringify(extractedData) : 'Nincs'}
${sizeUspContext}

FELADAT:
1. Készíts 5-8 USP javaslatot A FENTI FORRÁSOK ALAPJÁN
2. PRIORITÁS: Gyártói USP-k > Forgalmazói USP-k > Saját következtetés
3. Minden USP-nél jelöld meg a FORRÁST (gyártó/forgalmazó neve)
4. NE találj ki USP-ket - csak amit a kutatásban találtál!
5. Ha a gyártó mond valamit, az a legmegbízhatóbb

VÁLASZOLJ JSON FORMÁTUMBAN:
{
  "suggestions": [
    {
      "id": "UNIQUE_ID",
      "title": "USP cím (max 60 karakter)",
      "paragraph_1": "Első bekezdés - az előny kifejtése (2-3 mondat)",
      "paragraph_2": "Második bekezdés - gyakorlati haszon (2-3 mondat)",
      "source": "GYÁRTÓ/forgalmazó neve/következtetett",
      "source_type": "manufacturer/seller/inferred",
      "confidence": "high/medium/low",
      "original_claim": "Az eredeti állítás amit találtunk"
    }
  ],
  "sources_summary": {
    "manufacturer_claims_used": ["felhasznált gyártói állítások"],
    "seller_claims_used": ["felhasznált forgalmazói állítások"],
    "inferred_claims": ["saját következtetések (ezek kevésbé megbízhatóak)"]
  }
}`;

    const uspResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: uspPrompt }],
    });

    const uspText = uspResponse.content[0].type === 'text' ? uspResponse.content[0].text : '';

    let result: any = { suggestions: [], sources_summary: {} };
    try {
      const jsonMatch = uspText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      result = { suggestions: [], error: 'JSON parse hiba', raw: uspText };
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
      manufacturer_data: manufacturerData,
      competitor_data: competitorData,
      product_size_mm: productSize,
      size_context: productSize ? `${productSize}mm méretkategória` : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Versenytárs elemzés hiba:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Elemzési hiba'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

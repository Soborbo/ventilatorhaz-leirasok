import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

interface AnalyzeRequest {
  termekNev: string;
  gyarto: string;
  kategoria: string;
  extractedData?: Record<string, unknown>;
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

    // Get manufacturer domains
    const manufacturerDomains = MANUFACTURER_DOMAINS[gyarto] || [];
    const manufacturerSites = manufacturerDomains.length > 0
      ? manufacturerDomains.join(', ')
      : `${gyarto.toLowerCase()}.com, ${gyarto.toLowerCase()}.it, ${gyarto.toLowerCase()}.de`;

    // === LÉPÉS 1: Gyártói információk (LEGFONTOSABB) ===
    const manufacturerPrompt = `Keresd meg a "${gyarto} ${termekNev}" TERMÉKCSALÁD HIVATALOS gyártói leírását!

KERESS EZEKEN AZ OLDALAKON (fontossági sorrendben):
1. ${manufacturerSites} - A GYÁRTÓ HIVATALOS OLDALA (LEGFONTOSABB!)
2. A gyártó PDF adatlapja és katalógusa

MIT KERESS:
- Hogyan írja le a GYÁRTÓ a termékcsaládot? (NE az egyes méreteket!)
- Milyen előnyöket, USP-ket emel ki a gyártó?
- Milyen célcsoportnak ajánlja?
- Milyen technológiákat/funkciókat hangsúlyoz?

FONTOS:
- A gyártó saját szavait és marketingjét keresd, ne te találd ki!
- A TELJES termékcsaládra vonatkozó jellemzőket keresd, NE méretspecifikus adatokat!

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
    const competitorPrompt = `Keresd meg hogyan árulják MÁSOK a "${gyarto} ${termekNev}" TERMÉKCSALÁDOT!

KERESS EZEKEN AZ OLDALAKON:
1. Magyar webshopok: szelep.hu, szelloztetes.hu, ventilator.hu, praktiker.hu, obi.hu, bauhaus.hu
2. Nemzetközi webshopok: amazon.de, ebay.de, conrad.de
3. Szakmai fórumok, vélemények

MIT KERESS:
- Milyen USP-ket/előnyöket használnak a forgalmazók a TERMÉKCSALÁDRA?
- Hogyan pozicionálják a terméket?
- Mit emelnek ki a termékleírásokban?
- Milyen vásárlói vélemények vannak?

FONTOS:
- A TÉNYLEGES forgalmazói szövegeket gyűjtsd, ne te találd ki!
- NE méretspecifikus adatokat keress, hanem a termékcsaládra jellemzőket!

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

    // === LÉPÉS 3: USP javaslatok összeállítása A GYÁRTÓI ADATOK ALAPJÁN ===
    const uspPrompt = `A "${gyarto} ${termekNev}" TERMÉKSORHOZ készíts USP javaslatokat.

⚠️ LEGFONTOSABB: HASZNÁLD A GYÁRTÓ SAJÁT SZAVAIT!
Az alábbi gyártói információkat kaptuk - ezekből készíts USP-ket:

=== GYÁRTÓI HIVATALOS ÁLLÍTÁSOK (EZEKET HASZNÁLD!) ===
${JSON.stringify(manufacturerData, null, 2)}

=== PDF ADATLAP JELLEMZŐK ===
${extractedData ? JSON.stringify(extractedData, null, 2) : 'Nincs'}

=== FORGALMAZÓI LEÍRÁSOK (másodlagos forrás) ===
${JSON.stringify(competitorData, null, 2)}

📋 FELADAT:
1. Vedd a gyártó által TÉNYLEGESEN használt USP-ket/állításokat
2. Fordítsd le magyarra és fogalmazd át értékesítési szöveggé
3. NE találj ki új USP-ket - csak amit a gyártó mond!
4. SOHA ne említs méretet/átmérőt!

🎯 PÉLDÁK HELYES USP-KRE (a gyártói állítások alapján):

Ha a gyártó azt mondja: "Vertical or horizontal installation"
→ USP cím: "Rugalmas beépítés: függőlegesen és vízszintesen"
→ Paragraph: "A ventilátor egyaránt felszerelhető függőleges és vízszintes pozícióban..."

Ha a gyártó azt mondja: "Ball bearing EC motor"
→ USP cím: "Tartós EC motor golyóscsapággyal"
→ Paragraph: "Az EC technológiás motor golyóscsapágy ágyazással hosszú élettartamot..."

Ha a gyártó azt mondja: "Suitable for continuous running"
→ USP cím: "Folyamatos üzemre tervezve"
→ Paragraph: "24 órás folyamatos működésre alkalmas, megbízható háztartási és ipari..."

VÁLASZOLJ JSON FORMÁTUMBAN:
{
  "suggestions": [
    {
      "id": "USP_1",
      "title": "Magyar USP cím (max 50 karakter)",
      "paragraph_1": "A technikai előny kifejtése (2-3 mondat). Hivatkozz a konkrét gyártói jellemzőre.",
      "paragraph_2": "Gyakorlati haszon a vásárló számára (2-3 mondat).",
      "source": "${gyarto}",
      "source_type": "manufacturer",
      "confidence": "high",
      "original_claim": "A gyártó eredeti angol/olasz/német szövege",
      "image_suggestion": "product/installation/technical/lifestyle - milyen típusú kép illene hozzá"
    }
  ],
  "sources_summary": {
    "manufacturer_claims_used": ["felhasznált gyártói állítások eredeti nyelven"],
    "pdf_features_used": ["PDF-ből használt jellemzők"]
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

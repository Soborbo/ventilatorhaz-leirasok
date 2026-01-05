import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

interface AnalyzeRequest {
  termekNev: string;
  gyarto: string;
  kategoria: string;
  extractedData?: Record<string, unknown>;
}

interface UspSuggestion {
  id: string;
  title: string;
  paragraph_1: string;
  paragraph_2?: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

interface CompetitorInfo {
  source: string;
  url?: string;
  highlights: string[];
}

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

    // Első lépés: versenytárs információk gyűjtése web search-el
    const searchPrompt = `Keress információkat erről a ventilátorról: "${gyarto} ${termekNev}" (kategória: ${kategoria})

Nézd meg:
1. A gyártó hivatalos oldalát (${gyarto.toLowerCase()}.com, ${gyarto.toLowerCase()}.it, ${gyarto.toLowerCase()}.de stb.)
2. Magyar webshopokat (ventilatorhaz.hu versenytársai: szelep.hu, szelloztetes.hu, ventilator.hu, praktiker.hu, obi.hu)
3. Nemzetközi értékeléseket és teszteket
4. Termékcsalád jellemzőit

VÁLASZOLJ JSON FORMÁTUMBAN:
{
  "manufacturer_info": {
    "highlights": ["gyártó által kiemelt tulajdonságok"],
    "unique_features": ["egyedi jellemzők amit a gyártó hangsúlyoz"],
    "target_audience": "célcsoport"
  },
  "competitor_descriptions": [
    {
      "source": "webshop/oldal neve",
      "highlights": ["amit kiemelnek erről a termékről"],
      "selling_points": ["értékesítési érvek"]
    }
  ],
  "common_usp_themes": ["gyakori értékesítési érvek a kategóriában"],
  "differentiators": ["ami megkülönbözteti ezt a terméket a versenytársaktól"]
}`;

    const searchResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: searchPrompt }],
    });

    const searchText = searchResponse.content[0].type === 'text' ? searchResponse.content[0].text : '';

    let competitorData: any = {};
    try {
      const jsonMatch = searchText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        competitorData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      competitorData = { raw: searchText };
    }

    // Második lépés: USP javaslatok generálása
    const uspPrompt = `A következő ventilátor termékhez generálj USP (Unique Selling Point) javaslatokat:

Termék: ${gyarto} ${termekNev}
Kategória: ${kategoria}
${extractedData ? `Műszaki adatok: ${JSON.stringify(extractedData)}` : ''}

Versenytárs kutatás eredménye:
${JSON.stringify(competitorData, null, 2)}

Generálj 5-8 USP javaslatot, amelyek:
1. Kiemelik a termék erősségeit
2. Különböznek a meglévő USP könyvtártól (legyenek egyediek)
3. SEO szempontból optimalizáltak (de nem keyword stuffing)
4. Vásárlói előnyökre fókuszálnak (nem csak funkciókra)

VÁLASZOLJ JSON FORMÁTUMBAN:
{
  "suggestions": [
    {
      "id": "UNIQUE_ID",
      "title": "Figyelemfelkeltő cím - max 60 karakter",
      "paragraph_1": "Első bekezdés - a fő előny részletes kifejtése, 2-3 mondat",
      "paragraph_2": "Második bekezdés - gyakorlati haszon vagy technikai háttér, 2-3 mondat",
      "source": "Honnan származik ez az info (gyártó/versenytárs/következtetett)",
      "confidence": "high/medium/low",
      "seo_keywords": ["kulcsszavak amiket tartalmaz"]
    }
  ],
  "competitor_insights": [
    {
      "source": "forrás neve",
      "highlights": ["fontos információk"]
    }
  ]
}`;

    const uspResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: uspPrompt }],
    });

    const uspText = uspResponse.content[0].type === 'text' ? uspResponse.content[0].text : '';

    let result: any = { suggestions: [], competitor_insights: [] };
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
      competitor_data: competitorData
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

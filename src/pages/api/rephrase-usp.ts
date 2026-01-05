import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

interface RephraseRequest {
  title: string;
  paragraph_1: string;
  paragraph_2?: string;
  termekNev?: string;
  context?: string;
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
    const body: RephraseRequest = await request.json();
    const { title, paragraph_1, paragraph_2, termekNev, context } = body;

    if (!title || !paragraph_1) {
      return new Response(JSON.stringify({
        error: 'Hiányzó mezők: title, paragraph_1'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const prompt = `Fogalmazd át az alábbi USP (Unique Selling Point) szöveget úgy, hogy:
1. Megtartja az eredeti jelentést és üzenetet
2. Teljesen más szavakat és mondatszerkezetet használ
3. SEO szempontból egyedi legyen (ne legyen duplicate content)
4. Megőrzi a marketing stílust és meggyőző hangvételt
5. Hasonló hosszúságú marad

${termekNev ? `Termék: ${termekNev}` : ''}
${context ? `Kontextus: ${context}` : ''}

EREDETI USP:
Cím: ${title}
1. bekezdés: ${paragraph_1}
${paragraph_2 ? `2. bekezdés: ${paragraph_2}` : ''}

VÁLASZOLJ KIZÁRÓLAG JSON FORMÁTUMBAN:
{
  "title": "Átfogalmazott cím - max 60 karakter",
  "paragraph_1": "Átfogalmazott első bekezdés",
  ${paragraph_2 ? '"paragraph_2": "Átfogalmazott második bekezdés",' : ''}
  "changes_summary": "Rövid összefoglaló a változtatásokról"
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({
        error: 'Nem sikerült JSON-t kinyerni a válaszból'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({
      success: true,
      original: { title, paragraph_1, paragraph_2 },
      rephrased: parsed
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Átfogalmazási hiba:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Átfogalmazási hiba'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

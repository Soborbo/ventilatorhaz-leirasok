import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

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

    // Claude web search-öt használunk a PDF kereséshez
    const searchQuery = `${gyarto} ${termekNev} datasheet PDF filetype:pdf`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Keress PDF adatlapot ehhez a ventilátorhoz: "${termekNev}" gyártó: "${gyarto}"

Keresési tippek:
- Próbáld a gyártó hivatalos weboldalát (pl. elicent.it, maico.de, blauberg.de, vents.ua)
- Keress "datasheet", "adatlap", "technical data" kulcsszavakkal
- A PDF URL általában .pdf-re végződik

VÁLASZOLJ KIZÁRÓLAG JSON FORMÁTUMBAN:
{
  "found": true/false,
  "results": [
    {
      "url": "https://..../file.pdf",
      "title": "Termék adatlap neve",
      "source": "Gyártó hivatalos oldala / Forgalmazó"
    }
  ],
  "search_suggestions": ["alternatív keresési javaslatok ha nem találtál"]
}`
        }
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // JSON parse
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({
        found: false,
        results: [],
        search_suggestions: [`${gyarto} ${termekNev} adatlap PDF`]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('PDF keresési hiba:', error);
    return new Response(JSON.stringify({
      found: false,
      results: [],
      error: error instanceof Error ? error.message : 'Keresési hiba'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

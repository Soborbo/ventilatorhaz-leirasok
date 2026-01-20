import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { usp_title, termek_nev, gyarto } = await request.json();

    if (!usp_title || !termek_nev || !gyarto) {
      return new Response(
        JSON.stringify({ error: 'Hiányzó paraméterek: usp_title, termek_nev, gyarto' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Írj egy rövid, meggyőző bekezdést (2-3 mondat) egy ventilátor termékleíráshoz.

Termék: ${termek_nev}
Gyártó: ${gyarto}
USP (egyedi előny) címe: ${usp_title}

Szabályok:
- Magyar nyelven írj
- Legyen informatív és meggyőző
- Ne használj túlzó jelzőket
- Konkrét előnyökre fókuszálj
- Maximum 2-3 mondat
- Ne kezdd "A ${termek_nev}" vagy hasonlóval, kezdj rögtön az előnnyel

Csak a bekezdés szövegét add vissza, semmi mást.`
        }
      ]
    });

    const textContent = response.content.find(block => block.type === 'text');
    const generatedText = textContent ? textContent.text.trim() : '';

    return new Response(
      JSON.stringify({ text: generatedText }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('USP text generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Hiba a szöveg generálása közben' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

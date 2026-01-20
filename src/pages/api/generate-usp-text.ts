import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

type TextType = 'usp' | 'intro_title' | 'intro_p1' | 'intro_p2' | 'tudta';

const getPrompt = (type: TextType, termek_nev: string, gyarto: string, usp_title?: string): string => {
  switch (type) {
    case 'usp':
      return `Írj egy rövid, meggyőző bekezdést (2-3 mondat) egy ventilátor termékleíráshoz.

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

Csak a bekezdés szövegét add vissza, semmi mást.`;

    case 'intro_title':
      return `Írj egy figyelemfelkeltő címet egy ventilátor termékleíráshoz.

Termék: ${termek_nev}
Gyártó: ${gyarto}

Szabályok:
- Magyar nyelven írj
- Legyen figyelemfelkeltő de nem túlzó
- Tartalmazd a termék nevét
- Maximum 8-10 szó
- Ne használj felkiáltójelet

Csak a címet add vissza, semmi mást.`;

    case 'intro_p1':
      return `Írj egy bevezető bekezdést egy ventilátor termékleíráshoz.

Termék: ${termek_nev}
Gyártó: ${gyarto}

Szabályok:
- Magyar nyelven írj
- Mutasd be röviden a terméket és mire alkalmas
- 2-3 mondat maximum
- Legyen informatív, ne túl reklámszerű
- Kezdheted "A ${termek_nev}" formával

Csak a bekezdés szövegét add vissza, semmi mást.`;

    case 'intro_p2':
      return `Írj egy második bevezető bekezdést egy ventilátor termékleíráshoz.

Termék: ${termek_nev}
Gyártó: ${gyarto}

Szabályok:
- Magyar nyelven írj
- Emeld ki a fő előnyöket (megbízhatóság, egyszerű szerelés, hosszú élettartam stb.)
- 2-3 mondat maximum
- Ne ismételd az első bekezdést
- Legyen meggyőző de nem túlzó

Csak a bekezdés szövegét add vissza, semmi mást.`;

    case 'tudta':
      return `Írj egy érdekes "Tudta?" tényt egy ventilátor gyártóról.

Termék: ${termek_nev}
Gyártó: ${gyarto}

Szabályok:
- Magyar nyelven írj
- Írj egy érdekes tényt a gyártóról (alapítás éve, származási ország, specialitás, díjak stb.)
- 1-2 mondat maximum
- NE kezdd "Tudta?" szóval, az már ott lesz
- Legyen hiteles és informatív

Csak a tény szövegét add vissza, semmi mást.`;

    default:
      return '';
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { type, termek_nev, gyarto, usp_title } = await request.json();

    if (!termek_nev || !gyarto) {
      return new Response(
        JSON.stringify({ error: 'Hiányzó paraméterek: termek_nev, gyarto' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'usp' && !usp_title) {
      return new Response(
        JSON.stringify({ error: 'USP generáláshoz szükséges az usp_title' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const prompt = getPrompt(type as TextType, termek_nev, gyarto, usp_title);

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Ismeretlen type paraméter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = response.content.find(block => block.type === 'text');
    const generatedText = textContent ? textContent.text.trim() : '';

    return new Response(
      JSON.stringify({ text: generatedText }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Text generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Hiba a szöveg generálása közben' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

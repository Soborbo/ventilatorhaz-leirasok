import type { APIRoute } from 'astro';
import {
  createAnthropicClient,
  extractJsonFromResponse,
  jsonResponse,
  errorResponse,
  CLAUDE_MODEL
} from '../../lib/api-utils';

export const prerender = false;

interface RephraseRequest {
  title: string;
  paragraph_1: string;
  paragraph_2?: string;
  termekNev?: string;
  context?: string;
}

interface RephraseResult {
  title: string;
  paragraph_1: string;
  paragraph_2?: string;
  changes_summary?: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const { client, error } = createAnthropicClient(locals);
  if (error) return error;

  try {
    const body: RephraseRequest = await request.json();
    const { title, paragraph_1, paragraph_2, termekNev, context } = body;

    if (!title || !paragraph_1) {
      return errorResponse('Hiányzó mezők: title, paragraph_1', 400);
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
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = extractJsonFromResponse<RephraseResult>(responseText);

    if (!parsed) {
      return errorResponse('Nem sikerült JSON-t kinyerni a válaszból');
    }

    return jsonResponse({
      success: true,
      original: { title, paragraph_1, paragraph_2 },
      rephrased: parsed
    });

  } catch (error) {
    console.error('Átfogalmazási hiba:', error);
    return errorResponse(error instanceof Error ? error.message : 'Átfogalmazási hiba');
  }
};

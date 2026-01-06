import type { APIRoute } from 'astro';

export const prerender = false;

interface ApiStatus {
  gemini: {
    configured: boolean;
    connected: boolean;
    error?: string;
  };
  claude: {
    configured: boolean;
    connected: boolean;
    error?: string;
  };
}

/**
 * Get API keys from Cloudflare runtime or environment
 */
function getApiKeys(locals: unknown): { geminiKey?: string; claudeKey?: string } {
  const runtime = (locals as { runtime?: { env?: { GEMINI_API_KEY?: string; ANTHROPIC_API_KEY?: string } } }).runtime;
  return {
    geminiKey: runtime?.env?.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY,
    claudeKey: runtime?.env?.ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY,
  };
}

/**
 * Test Gemini API connection
 */
async function testGemini(apiKey: string): Promise<{ connected: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say "OK"' }] }],
          generationConfig: { maxOutputTokens: 10 }
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return { connected: false, error: data.error?.message || `HTTP ${response.status}` };
    }

    return { connected: true };
  } catch (error) {
    return { connected: false, error: error instanceof Error ? error.message : 'Connection failed' };
  }
}

/**
 * Test Claude API connection
 */
async function testClaude(apiKey: string): Promise<{ connected: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "OK"' }],
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return { connected: false, error: data.error?.message || `HTTP ${response.status}` };
    }

    return { connected: true };
  } catch (error) {
    return { connected: false, error: error instanceof Error ? error.message : 'Connection failed' };
  }
}

export const GET: APIRoute = async ({ locals }) => {
  const { geminiKey, claudeKey } = getApiKeys(locals);

  const status: ApiStatus = {
    gemini: {
      configured: !!geminiKey,
      connected: false,
    },
    claude: {
      configured: !!claudeKey,
      connected: false,
    },
  };

  // Test connections in parallel
  const [geminiResult, claudeResult] = await Promise.all([
    geminiKey ? testGemini(geminiKey) : Promise.resolve({ connected: false, error: 'Not configured' }),
    claudeKey ? testClaude(claudeKey) : Promise.resolve({ connected: false, error: 'Not configured' }),
  ]);

  status.gemini.connected = geminiResult.connected;
  status.gemini.error = geminiResult.error;
  status.claude.connected = claudeResult.connected;
  status.claude.error = claudeResult.error;

  return new Response(JSON.stringify(status), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

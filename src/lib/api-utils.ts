import Anthropic from '@anthropic-ai/sdk';

/**
 * Get Anthropic API key from Cloudflare runtime or environment
 */
export function getAnthropicApiKey(locals: unknown): string | undefined {
  const runtime = (locals as { runtime?: { env?: { ANTHROPIC_API_KEY?: string } } }).runtime;
  return runtime?.env?.ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY;
}

/**
 * Create Anthropic client with API key from environment
 */
export function createAnthropicClient(locals: unknown): { client: Anthropic; error?: never } | { client?: never; error: Response } {
  const apiKey = getAnthropicApiKey(locals);

  if (!apiKey) {
    return {
      error: new Response(JSON.stringify({
        error: 'ANTHROPIC_API_KEY nincs beállítva'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  return { client: new Anthropic({ apiKey }) };
}

/**
 * Extract JSON from Claude response text
 */
export function extractJsonFromResponse<T>(responseText: string): T | null {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}

/**
 * Create JSON response helper
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create error response helper
 */
export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

/**
 * Standard Claude model to use
 */
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

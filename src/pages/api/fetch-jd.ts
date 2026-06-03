import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { extractJdText } from '../../lib/jd-extract';

const DISTILL_PROMPT = `You receive the raw text from a job-posting web page. Web chrome is mixed in: nav, footer, sidebar, "related openings", legal/EEO boilerplate, "Apply now" buttons, cookie banners, "About the company" marketing.

Return ONLY the job-specific content for THIS role:
- Role title (one line at the top is fine)
- Team / department context (1-2 lines)
- Responsibilities / "What you'll do"
- Requirements / qualifications / "What you bring"
- Location, work model (remote/hybrid/onsite), comp if listed

Drop everything else. No preamble, no "Here is the job description:", no markdown fences. Plain text, blank line between sections.

If the input doesn't actually contain a job posting (404, login wall, list of unrelated jobs, etc.), output exactly: NO_JD_FOUND`;

async function distillJobDescription(
  rawText: string,
  apiKey: string
): Promise<string | null | 'absent'> {
  const anthropic = createAnthropic({ apiKey });
  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5'),
    system: DISTILL_PROMPT,
    prompt: rawText,
    maxOutputTokens: 4000,
    temperature: 0.1
  });
  const cleaned = text.trim();
  if (!cleaned) return null;
  if (cleaned === 'NO_JD_FOUND' || cleaned.startsWith('NO_JD_FOUND')) return 'absent';
  return cleaned;
}

const MAX_BODY_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_URL_LENGTH = 2000;
const MIN_EXTRACTED_LENGTH = 40;

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost') return true;
  if (lower.endsWith('.local') || lower.endsWith('.internal')) return true;
  if (/^10\./.test(lower)) return true;
  if (/^127\./.test(lower)) return true;
  if (/^192\.168\./.test(lower)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(lower)) return true;
  if (/^169\.254\./.test(lower)) return true;
  if (lower === '::1') return true;
  if (lower.startsWith('fe80:') || lower.startsWith('fc00:') || lower.startsWith('fd00:')) {
    return true;
  }
  return false;
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (env.FETCH_JD_RATE_LIMITER) {
    const { success } = await env.FETCH_JD_RATE_LIMITER.limit({ key: clientIp });
    if (!success) return jsonError(429, "You're fetching URLs too fast. Try again in a minute.");
  }
  if (env.GLOBAL_RATE_LIMITER) {
    const { success } = await env.GLOBAL_RATE_LIMITER.limit({ key: 'global' });
    if (!success) return jsonError(429, 'Service is at capacity. Try again in a minute.');
  }

  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const rawUrl = body?.url?.trim();
  if (!rawUrl) return jsonError(400, 'Provide a URL.');
  if (rawUrl.length > MAX_URL_LENGTH) return jsonError(400, 'URL is too long.');

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return jsonError(400, 'That URL is not valid.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return jsonError(400, 'Only http(s) URLs are allowed.');
  }
  if (isBlockedHostname(parsed.hostname)) {
    return jsonError(400, 'That URL is not reachable.');
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(parsed.toString(), {
      method: 'GET',
      signal: ac.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; sprouse.dev JD fetcher)',
        accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9'
      }
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      return jsonError(504, 'The page took too long to load.');
    }
    return jsonError(502, "Couldn't reach that URL.");
  }
  clearTimeout(timer);

  if (!res.ok) {
    return jsonError(
      res.status === 404 ? 404 : 502,
      `Fetching the URL failed (HTTP ${res.status}).`
    );
  }
  const contentType = res.headers.get('content-type') || '';
  if (
    !contentType.includes('text/html') &&
    !contentType.includes('text/plain') &&
    !contentType.includes('application/xhtml')
  ) {
    return jsonError(415, `Unsupported content type (${contentType.split(';')[0] || 'unknown'}).`);
  }

  const reader = res.body?.getReader();
  if (!reader) return jsonError(502, 'The page returned an empty response.');
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      return jsonError(413, 'The page is too large to fetch.');
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) {
    buf.set(c, pos);
    pos += c.byteLength;
  }
  const html = new TextDecoder('utf-8', { fatal: false }).decode(buf);

  const { title, text: rawText } = extractJdText(html);
  if (rawText.length < MIN_EXTRACTED_LENGTH) {
    return jsonError(
      422,
      "Couldn't extract the job description from that page. Try pasting the text directly."
    );
  }

  // Run a cheap model pass to drop nav/footer/related-jobs/EEO boilerplate
  // and isolate the actual JD. Falls back to the raw text if the API key
  // is missing or the call fails — the user can still edit the textarea.
  let finalText = rawText;
  const apiKey = env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const distilled = await distillJobDescription(rawText, apiKey);
      if (distilled === 'absent') {
        return jsonError(422, "That page doesn't appear to be a job posting.");
      }
      if (distilled) finalText = distilled;
    } catch {
      // Distillation failure → fall back to raw text.
    }
  }

  return new Response(JSON.stringify({ title, text: finalText, sourceUrl: parsed.toString() }), {
    headers: { 'content-type': 'application/json' }
  });
};

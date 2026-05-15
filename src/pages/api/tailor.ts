import type { APIRoute } from 'astro';
import { generateObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { tailorPatchSchema } from '../../lib/tailor-schema';
import { SKILL_VOCABULARY, buildTailorSystemPrompt } from '../../lib/tailor-prompt';

// Lowercased lookup so server-side validation tolerates minor capitalization
// drift from the model output.
const SKILL_ALLOWLIST = new Map(SKILL_VOCABULARY.map((s) => [s.toLowerCase(), s]));

// Closing tag stripped from JD input so a malicious paste can't end the
// untrusted block and inject instructions visible to the model.
function neutralizeJd(input: string): string {
  return input.replace(/<\/?untrusted_job_description>/gi, '[redacted-tag]');
}

export const prerender = false;

interface RateLimiter {
  limit: (input: { key: string }) => Promise<{ success: boolean }>;
}

interface RuntimeEnv {
  ANTHROPIC_API_KEY?: string;
  TAILOR_RATE_LIMITER?: RateLimiter;
  GLOBAL_RATE_LIMITER?: RateLimiter;
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

const MAX_JD_LENGTH = 12000;

export const POST: APIRoute = async ({ request, locals }) => {
  const env: RuntimeEnv = (locals as { runtime?: { env?: RuntimeEnv } }).runtime?.env ?? {};

  const apiKey =
    env.ANTHROPIC_API_KEY ??
    (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : undefined);

  if (!apiKey) {
    return jsonError(500, 'ANTHROPIC_API_KEY not configured');
  }

  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (env.TAILOR_RATE_LIMITER) {
    const { success } = await env.TAILOR_RATE_LIMITER.limit({ key: clientIp });
    if (!success) {
      return jsonError(429, 'Tailoring is rate-limited. Try again in a minute.');
    }
  }

  if (env.GLOBAL_RATE_LIMITER) {
    const { success } = await env.GLOBAL_RATE_LIMITER.limit({ key: 'global' });
    if (!success) {
      return jsonError(429, 'Service is at capacity. Try again in a minute.');
    }
  }

  const body = (await request.json().catch(() => null)) as { jobDescription?: string } | null;
  const jd = body?.jobDescription?.trim();

  if (!jd || jd.length < 40) {
    return jsonError(400, 'Please paste a longer job description (at least a few sentences).');
  }
  if (jd.length > MAX_JD_LENGTH) {
    return jsonError(400, `Job description too long (max ${MAX_JD_LENGTH} chars).`);
  }

  const anthropic = createAnthropic({ apiKey });

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      system: buildTailorSystemPrompt(),
      prompt: `<untrusted_job_description>\n${neutralizeJd(jd)}\n</untrusted_job_description>`,
      schema: tailorPatchSchema,
      temperature: 0.4,
      maxOutputTokens: 2000
    });

    // Belt-and-suspenders: even though the schema constrains the response,
    // strip any emphasizedSkills the model invented that aren't in the
    // canonical vocabulary. Casing is normalized to match SKILL_VOCABULARY.
    const filteredSkills: string[] = [];
    for (const raw of object.emphasizedSkills) {
      const canonical = SKILL_ALLOWLIST.get(raw.toLowerCase().trim());
      if (canonical && !filteredSkills.includes(canonical)) {
        filteredSkills.push(canonical);
      }
    }
    const filteredObject = { ...object, emphasizedSkills: filteredSkills };

    return new Response(JSON.stringify(filteredObject), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonError(500, `Tailoring failed: ${message}`);
  }
};

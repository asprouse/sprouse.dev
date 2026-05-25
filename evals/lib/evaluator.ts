// Calls Claude with a fixed hiring-manager rubric and returns
// { rating: 1-10, rationale: string }. The same evaluator runs on both
// before-and-after CVs so absolute bias cancels in the delta.
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function getApiKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const vars = await readFile(join(__dirname, '../../.dev.vars'), 'utf8');
    const m = vars.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/m);
    if (m?.[1]) return m[1].replace(/^["']|["']$/g, '').trim();
  } catch {
    // fall through
  }
  throw new Error('ANTHROPIC_API_KEY not set in env or .dev.vars');
}

const apiKey = await getApiKey();
const client = new Anthropic({ apiKey });

const SYSTEM_PROMPT = `You are an experienced engineering hiring manager evaluating a candidate's CV against a job description (JD).

Rate fit on a 1–10 integer scale:
- 1–3: missing core requirements (would not advance to phone screen)
- 4–6: partial fit with significant gaps (might advance with strong references)
- 7–8: strong fit with minor gaps (would advance to interview)
- 9–10: excellent fit, all major requirements met (would prioritize)

Consider:
- Relevance of experience to the role's responsibilities
- Skill match (technical stack, domain expertise)
- Seniority fit (years, scope of past work)
- Quality of evidence (named customers, shipped products, recognition)
- Story coherence — does the CV's framing match the role's shape?

Output strictly valid JSON, no other text, no markdown fences:
{ "rating": <integer 1-10>, "rationale": "<2-3 sentence rationale>" }`;

export interface EvaluateInput {
  jd: string;
  cv: string;
  model?: string;
}

export interface EvaluationResult {
  rating: number;
  rationale: string;
}

export async function evaluate({
  jd,
  cv,
  model = 'claude-sonnet-4-5'
}: EvaluateInput): Promise<EvaluationResult> {
  const response = await client.messages.create({
    model,
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `<job_description>\n${jd}\n</job_description>\n\n<cv>\n${cv}\n</cv>\n\nRate the fit.`
      }
    ]
  });

  const text = response.content
    .filter((c): c is Anthropic.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('');

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON in evaluator response: ${text}`);
  const parsed = JSON.parse(match[0]) as Partial<EvaluationResult>;
  if (typeof parsed.rating !== 'number' || typeof parsed.rationale !== 'string') {
    throw new Error(`Malformed evaluator response: ${JSON.stringify(parsed)}`);
  }
  return { rating: parsed.rating, rationale: parsed.rationale };
}

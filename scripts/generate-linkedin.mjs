#!/usr/bin/env node
// Distills andrew/cv.yml + variant positioning into LinkedIn paste-ready blocks
// (Headline, About, per-role Experience), each with a character count next to
// it so you can see what fits the LinkedIn editor's limits. Overwrites the
// destination; rely on git for diffs and recovery.
//
// Usage:
//   node scripts/generate-linkedin.mjs [variant]
//     variant: cto (default) | principal | cofounder
//
// Reads ANTHROPIC_API_KEY from the environment, or from .dev.vars if present.

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import yaml from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const devVarsPath = join(repoRoot, '.dev.vars');
if (existsSync(devVarsPath)) process.loadEnvFile(devVarsPath);

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set. Add it to .dev.vars or export it.');
  process.exit(1);
}

const variantSlug = process.argv[2] || 'cto';
if (!['cto', 'principal', 'cofounder'].includes(variantSlug)) {
  console.error(`Unknown variant: ${variantSlug}. Use cto, principal, or cofounder.`);
  process.exit(1);
}

const resumePath = join(repoRoot, 'andrew/cv.yml');
const destPath = join(repoRoot, 'linkedin.md');

const resume = yaml.parse(readFileSync(resumePath, 'utf8'));
const variantData = resume.variants[variantSlug];
const existing = existsSync(destPath) ? readFileSync(destPath, 'utf8').trim() : '';

// Keep the same current-era cutoff used by the resume site (2015-01).
const CURRENT_ERA_FROM = '2015-01';
const currentEra = resume.experience.filter((r) => r.dateRange.from >= CURRENT_ERA_FROM);

// Strip the full project tech arrays — LinkedIn copy shouldn't enumerate the
// stack, and trimming keeps the prompt focused.
const rolesPayload = currentEra.map((r) => ({
  company: r.company,
  title: r.title,
  dateRange: r.dateRange,
  description: r.description,
  projects: r.projects.map((p) => ({ title: p.title ?? null, description: p.description }))
}));

const voiceAnchor = existing
  ? `Voice anchors — preserve tone and rhythm from the existing version below where it lands. Refresh specifics from the source data where they're better; keep the lines that already work.

<existing>
${existing}
</existing>

`
  : '';

const prompt = `You are producing LinkedIn paste-ready content for Andrew Sprouse from his resume data.

LinkedIn is the teaser — the CV at sprouse.dev/cv is the proof. Don't list every project. Compress each role into something a recruiter will skim in 5 seconds.

VARIANT: Andrew is positioning for the "${variantSlug}" lens. Calibrate tone and emphasis accordingly — the variant's tagline, proof bullets, and openTo line are in the <variant> block below.

OUTPUT FORMAT — emit this exact markdown structure, nothing else, no commentary, no code fences:

# LinkedIn paste blocks — ${variantSlug} variant

## Headline (220 chars max)
<one line. Current role + a sharp angle that mirrors the variant tagline. NO emojis. Plain text.>
[<count> / 220 chars]

## About (2,600 chars max)
<2–4 short paragraphs in first person, Andrew's voice. Lead with a one-line variant tagline, then 2–3 concrete proof anchors (TakeShape schema language, agent runtime, Fair Tread HTTP-402, Valvoline, etc.), close with the openTo line and a link to sprouse.dev/cv for the full story. Plain text — LinkedIn does not render markdown. Blank lines between paragraphs are fine.>
[<count> / 2600 chars]

## Experience

### <Company> — <Title>
<2–4 short bullets, each on its own line prefixed with "• ". Outcome-led, not task-led. Name one or two concrete things the role shipped (e.g. "schema language," "agent runtime," "HTTP-402 payment gateway") but skip the project-by-project breakdown — the CV has that. Plain text.>
[<count> / 2000 chars]

<repeat the ### block, in the same order as <current-era-roles>, for every role>

CHARACTER COUNTING RULES:
- Count only the body text — exclude the heading, the trailing "[... / ... chars]" line, and any surrounding blank lines.
- For the About section, include the blank lines between paragraphs in the count (they exist in the paste).
- Be accurate. If a section is over budget, tighten it until it fits — going over invalidates the block.

VOICE RULES:
- First person. Andrew's voice: specific, plainspoken, no LinkedIn-influencer cadence.
- No emojis. No corporate verbs ("synergize," "spearheaded," "leveraged"). No filler.
- It's fine — encouraged — to mention concrete artifacts and outcomes by name.
- For the LinkedIn audience: assume the reader has not seen the CV yet. Don't reference "the projects above" or anything that implies more context.

${voiceAnchor}<variant>
${JSON.stringify(variantData, null, 2)}
</variant>

<resume-summary>
${resume.summary}
</resume-summary>

<current-era-roles>
${JSON.stringify(rolesPayload, null, 2)}
</current-era-roles>

Output ONLY the markdown — no preamble, no commentary, no code fences.`;

const client = new Anthropic();
const response = await client.messages.create({
  model: 'claude-opus-4-7',
  max_tokens: 6000,
  messages: [{ role: 'user', content: prompt }]
});

const block = response.content[0];
if (block.type !== 'text') {
  console.error('Expected a text block in the response, got:', block.type);
  process.exit(1);
}

writeFileSync(destPath, block.text.trim() + '\n');
console.log(`✓ Wrote ${destPath} (${variantSlug} variant)`);
console.log(`  ${response.usage.input_tokens} in / ${response.usage.output_tokens} out tokens`);

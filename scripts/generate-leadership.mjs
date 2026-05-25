#!/usr/bin/env node
// Distills andrew/qa/04-leadership.md into andrew/leadership.md as 5 themed
// blocks in Andrew's voice. Overwrites the destination; rely on git for diffs
// and recovery if the regeneration goes sideways.
//
// Reads ANTHROPIC_API_KEY from the environment, or from .dev.vars if present.

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const devVarsPath = join(repoRoot, '.dev.vars');
if (existsSync(devVarsPath)) process.loadEnvFile(devVarsPath);

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set. Add it to .dev.vars or export it.');
  process.exit(1);
}

const sourcePath = join(repoRoot, 'andrew/qa/04-leadership.md');
const destPath = join(repoRoot, 'andrew/leadership.md');

const source = readFileSync(sourcePath, 'utf8');
const existing = existsSync(destPath) ? readFileSync(destPath, 'utf8').trim() : '';

const voiceAnchor = existing
  ? `Voice anchors — preserve tone and rhythm from the existing version below. Swap in fresher specifics from the source Q&A where they're better; keep the lines that already land.

<existing>
${existing}
</existing>

`
  : '';

const prompt = `You are distilling a leadership Q&A corpus into a tight, scannable summary for Andrew Sprouse's resume site.

Output exactly 5 themes covering: Hiring, Decision-making, Communication, Conflict & feedback, and Leading through AI. Each theme is:
- One heading: "# <Theme title>"
- A blank line
- 3–5 sentences of body in first-person, Andrew's voice. Specific. No filler. Light markdown emphasis (*word*) is allowed for one or two words per theme if it earns its keep.

${voiceAnchor}<source>
${source}
</source>

Output ONLY the markdown — five "# Heading" blocks, nothing else. No preamble, no commentary.`;

const client = new Anthropic();
const response = await client.messages.create({
  model: 'claude-opus-4-7',
  max_tokens: 2000,
  messages: [{ role: 'user', content: prompt }]
});

const block = response.content[0];
if (block.type !== 'text') {
  console.error('Expected a text block in the response, got:', block.type);
  process.exit(1);
}

writeFileSync(destPath, block.text.trim() + '\n');
console.log(`✓ Wrote ${destPath}`);
console.log(`  ${response.usage.input_tokens} in / ${response.usage.output_tokens} out tokens`);

#!/usr/bin/env node
// Pre-parses andrew/qa/*.md into src/lib/qa-corpus.generated.ts so the
// Cloudflare worker doesn't have to do regex-based markdown parsing on
// every cold start. The chat endpoint is used infrequently enough that
// nearly every chat session would otherwise pay the parse cost (~10-30ms).
//
// Runs in:
// - `predev` (so dev server has the artifact)
// - `prebuild` (so production deploy has it)
// - `pretypecheck` (so `astro check` can resolve the import)
//
// The output file is gitignored — it's a build artifact regenerated from
// the .md sources on every dev/build/typecheck.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { QAEntry } from '../src/lib/qa-corpus.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const qaDir = join(root, 'andrew/qa');
const outPath = join(root, 'src/lib/qa-corpus.generated.ts');

// Parser is duplicated from src/lib/qa-corpus.ts on purpose. The runtime
// version is imported by Vite into the Cloudflare worker bundle; running
// the same module here would pull in Vite-y types/exports we don't need.
// The logic is small enough that a parallel copy is cheaper than the
// indirection. Keep the two in sync.
const FRONTMATTER_RE = /^---\r?\n([\s\S]+?)\r?\n---\r?\n/;
const METADATA_RE = /<!--\s*id:\s*([\w-]+)\s*\|\s*tags:\s*\[([^\]]*)\]\s*-->/g;

function extractField(frontmatter: string, key: string): string {
  const m = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m?.[1]?.trim() ?? '';
}

function parseFile(content: string): QAEntry[] {
  const fmMatch = content.match(FRONTMATTER_RE);
  if (!fmMatch?.[1]) return [];
  const fm = fmMatch[1];
  const category = extractField(fm, 'category');
  const categoryTitle = extractField(fm, 'title');
  if (!category) return [];

  const body = content.slice(fmMatch[0].length);
  const matches = [...body.matchAll(METADATA_RE)];
  const entries: QAEntry[] = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (!m || m.index === undefined) continue;
    const id = m[1];
    const tagsRaw = m[2];
    if (!id || tagsRaw === undefined) continue;

    const next = matches[i + 1];
    const blockStart = m.index + m[0].length;
    const blockEnd = next?.index ?? body.length;
    const block = body.slice(blockStart, blockEnd);

    const headingMatch = block.match(/^[ \t]*##\s+(?:\d+\.\s+)?(.+?)[ \t]*$/m);
    const question = headingMatch?.[1]?.trim();
    if (!headingMatch || !question) continue;

    const headingIdx = block.indexOf(headingMatch[0]);
    const afterHeading = block.slice(headingIdx + headingMatch[0].length);
    const answer = afterHeading.trim();
    if (!answer) continue;

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    entries.push({ id, category, categoryTitle, tags, question, answer });
  }
  return entries;
}

const files = (await readdir(qaDir)).filter((f) => f.endsWith('.md')).sort();

const corpus: QAEntry[] = [];
for (const file of files) {
  const content = await readFile(join(qaDir, file), 'utf8');
  corpus.push(...parseFile(content));
}

const banner = `// AUTO-GENERATED — do not edit by hand.
// Source of truth: andrew/qa/*.md
// Regenerate with: npm run gen:qa-corpus
//
// Pre-parsed at build time so the worker doesn't pay markdown-parse cost
// on every cold start. See scripts/gen-qa-corpus.ts for the generator.

import type { QAEntry } from './qa-corpus';

export const generatedCorpus: QAEntry[] = ${JSON.stringify(corpus, null, 2)};
`;

await writeFile(outPath, banner);
console.log(
  `✓ Wrote ${outPath.replace(root + '/', '')} (${corpus.length} entries from ${files.length} files)`
);

// Dumps the currently composed tailor system prompt to a local file so
// it can be eyeballed during iteration. The output is gitignored — it's
// an inspection artifact, not a source of truth.
//
// Usage:  npm run inspect:tailor-prompt
//         less tailor-prompt.dump.txt
//
// We can't `import { composeSystemPrompt }` from src/lib/tailor/ here
// because that module pulls chatbot/profile.md via Vite's `?raw` loader,
// which only exists inside the Astro build. So this script extracts the
// INSTRUCTIONS template by string match and reuses the Node-side context
// loader. If the composition logic in src/lib/tailor/prompt.ts changes
// (e.g., new placeholders), update both this script and the template.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTailorContext } from './lib/context.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const promptSrc = await readFile(join(root, 'src/lib/tailor/prompt.ts'), 'utf8');
const match = promptSrc.match(/const INSTRUCTIONS = `([\s\S]*?)`;/);
if (!match) {
  console.error('Could not locate INSTRUCTIONS template in src/lib/tailor/prompt.ts');
  process.exit(1);
}
const template = match[1];

const ctx = await loadTailorContext();
const composed = template
  .replace('{{SKILL_VOCABULARY}}', ctx.skillVocabulary.join(', '))
  .replace('{{ROLES}}', ctx.roles)
  .replace('{{BACKGROUND}}', ctx.background);

const outPath = join(root, 'tailor-prompt.dump.txt');
await writeFile(outPath, composed);

console.log(`Wrote ${composed.length} chars to ${outPath}`);
console.log(`Skill vocabulary: ${ctx.skillVocabulary.length} items`);

// Dumps the currently composed tailor system prompt to a local file so
// it can be eyeballed during iteration. The output is gitignored — it's
// an inspection artifact, not a source of truth.
//
// Usage:  npm run inspect:tailor-prompt
//         less tailor-prompt.dump.txt
//
// We can't `import { composeSystemPrompt }` here because that module pulls
// chatbot/profile.md via Vite's `?raw` loader, which only exists inside
// the Astro/Vite build. So this script replicates the composition by
// reading the same sources directly from disk and stitching them with the
// same template logic. If the composition logic in src/lib/tailor/prompt.ts
// changes meaningfully, update this script to match.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const resume = JSON.parse(await readFile(join(root, 'resume.json'), 'utf8'));
const profile = await readFile(join(root, 'chatbot/profile.md'), 'utf8');
const promptSrc = await readFile(join(root, 'src/lib/tailor/prompt.ts'), 'utf8');

const CURRENT_ERA_FROM = '2015-01';

function slugifyCompany(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatRoles() {
  return resume.experience
    .map((role) => {
      const slug = slugifyCompany(role.company);
      const era = role.dateRange.from < CURRENT_ERA_FROM ? 'retrospective' : 'current';
      const projects = role.projects
        .map((p, idx) => {
          const title = p.title ? `${p.title} — ` : '';
          const desc = p.description.replace(/<[^>]+>/g, '').slice(0, 300);
          const techs = p.technologies.join(', ');
          return `    [${idx}] ${title}${desc}\n         techs: ${techs}`;
        })
        .join('\n');
      const desc = role.description.replace(/<[^>]+>/g, '');
      const dateLine = `${role.dateRange.from} → ${role.dateRange.to ?? 'present'}`;
      return `${role.company} (slug: ${slug}, era: ${era}) — ${role.title}\n  ${dateLine}\n  Summary: ${desc}\n  Projects:\n${projects}`;
    })
    .join('\n\n');
}

function buildSkillVocabulary() {
  const seen = new Set();
  const vocab = [];
  for (const role of resume.experience) {
    const isRetro = role.dateRange.from < CURRENT_ERA_FROM;
    for (const project of role.projects) {
      for (const slug of project.technologies) {
        const tech = resume.technologies[slug];
        if (!tech) continue;
        if (isRetro && tech.category !== 'language') continue;
        if (seen.has(tech.name)) continue;
        seen.add(tech.name);
        vocab.push(tech.name);
      }
    }
  }
  return vocab;
}

function extractBackground() {
  return profile.replace(/^---[\s\S]*?---\n+/, '').trim();
}

// Pull the INSTRUCTIONS template literal out of prompt.ts by string match.
const match = promptSrc.match(/const INSTRUCTIONS = `([\s\S]*?)`;/);
if (!match) {
  console.error('Could not locate INSTRUCTIONS template in src/lib/tailor/prompt.ts');
  process.exit(1);
}
const template = match[1];

const composed = template
  .replace('{{SKILL_VOCABULARY}}', buildSkillVocabulary().join(', '))
  .replace('{{ROLES}}', formatRoles())
  .replace('{{BACKGROUND}}', extractBackground());

const outPath = join(root, 'tailor-prompt.dump.txt');
await writeFile(outPath, composed);

console.log(`Wrote ${composed.length} chars to ${outPath}`);
console.log(`Skill vocabulary: ${buildSkillVocabulary().length} items`);

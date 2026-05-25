// Node-side mirror of src/lib/tailor/context.ts. Used by Node scripts
// (inspect-tailor-prompt, gen-cover-letter) that can't go through Vite's
// ?raw loader. The shapes returned MUST match what context.ts produces
// — keep them in sync. The eval (`npm run eval:tailor`) is the canary
// that catches drift, since it hits the production code path.
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';
import type { Resume } from '../../src/types/resume.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

const CURRENT_ERA_FROM = '2015-01';

export interface TailorContext {
  skillVocabulary: string[];
  roles: string;
  background: string;
}

function slugifyCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatRoles(resume: Resume): string {
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
      const impact = role.impactBullets?.length
        ? `\n  Impact:\n${role.impactBullets.map((b) => `    • ${b.replace(/<[^>]+>/g, '')}`).join('\n')}`
        : '';
      return `${role.company} (slug: ${slug}, era: ${era}) — ${role.title}\n  ${dateLine}\n  Summary: ${desc}${impact}\n  Projects:\n${projects}`;
    })
    .join('\n\n');
}

function buildSkillVocabulary(resume: Resume): string[] {
  const seen = new Set<string>();
  const vocab: string[] = [];
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

function extractBackground(profileMd: string): string {
  return profileMd.replace(/^---[\s\S]*?---\n+/, '').trim();
}

export async function loadTailorContext(): Promise<TailorContext> {
  const [resumeRaw, profileMd] = await Promise.all([
    readFile(join(root, 'andrew/cv.yml'), 'utf8'),
    readFile(join(root, 'andrew/profile.md'), 'utf8')
  ]);
  const resume = yaml.parse(resumeRaw) as Resume;
  return {
    skillVocabulary: buildSkillVocabulary(resume),
    roles: formatRoles(resume),
    background: extractBackground(profileMd)
  };
}

export async function loadApiKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const vars = await readFile(join(root, '.dev.vars'), 'utf8');
    const m = vars.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/m);
    if (m?.[1]) return m[1].replace(/^["']|["']$/g, '').trim();
  } catch {
    // fall through
  }
  throw new Error('ANTHROPIC_API_KEY not set in env or .dev.vars');
}

// Pure-TS CV renderer: takes resume.json + an optional TailorPatch and
// produces a plain-text rendering equivalent to what a hiring manager would
// see on the print sheet. Used by the eval harness to feed before/after
// versions of the CV to the evaluator.
//
// Mirrors the apply-patch logic in src/lib/tailor/client.ts (project
// re-ranking, hiding, summary replacement) and the skills-derivation logic
// in src/lib/resume.ts (languages carry forward from retrospective era).
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';
import type { Resume, TechEntry } from '../../src/types/resume.ts';
import type { TailorPatch } from '../../src/lib/tailor/schema.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const resumePath = join(__dirname, '../../andrew/cv.yml');
export const resume = yaml.parse(await readFile(resumePath, 'utf8')) as Resume;

const CURRENT_ERA_FROM = '2015-01';

type VariantSlug = 'cto' | 'principal' | 'cofounder';

const VARIANTS: Record<VariantSlug, { tagline: string; openTo: string }> = {
  cto: { tagline: resume.variants.cto.tagline, openTo: resume.variants.cto.openTo },
  principal: {
    tagline: resume.variants.principal.tagline,
    openTo: resume.variants.principal.openTo
  },
  cofounder: {
    tagline: resume.variants.cofounder.tagline,
    openTo: resume.variants.cofounder.openTo
  }
};

function slugifyCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatYearMonth(ym: string): string {
  const [year, month] = ym.split('-');
  if (!month) return year ?? ym;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function formatDateRange(from: string, to: string | null): string {
  return `${formatYearMonth(from)} – ${to ? formatYearMonth(to) : 'Present'}`;
}

function deriveSkillsByCategory(): Record<string, string[]> {
  const usage = new Map<string, TechEntry>();
  for (const role of resume.experience) {
    const isRetro = role.dateRange.from < CURRENT_ERA_FROM;
    for (const project of role.projects) {
      for (const slug of project.technologies) {
        const tech = resume.technologies[slug];
        if (!tech) continue;
        if (isRetro && tech.category !== 'language') continue;
        if (!usage.has(slug)) usage.set(slug, tech);
      }
    }
  }
  const byCategory: Record<string, string[]> = {};
  for (const [, tech] of usage) {
    if (!byCategory[tech.category]) byCategory[tech.category] = [];
    byCategory[tech.category]!.push(tech.name);
  }
  return byCategory;
}

export interface RenderCvOptions {
  patch?: TailorPatch | null;
  variantSlug?: VariantSlug;
}

export function renderCv({ patch = null, variantSlug }: RenderCvOptions = {}): string {
  const lensSlug: VariantSlug = variantSlug || patch?.variant || 'cto';
  const variant = VARIANTS[lensSlug];
  const { person, experience } = resume;
  const fullName = `${person.first} ${person.last}`;
  const summary = patch?.summary || resume.summary;
  const emphasizedLower = new Set(
    (patch?.emphasizedSkills || []).map((s) => s.toLowerCase().trim())
  );

  const roleOverrides = new Map<string, TailorPatch['roles'][number]>();
  for (const r of patch?.roles || []) roleOverrides.set(r.companySlug, r);

  const lines: string[] = [];
  lines.push(fullName);
  lines.push(`Lens: ${lensSlug}`);
  lines.push(variant.tagline);
  lines.push('');
  lines.push(`Open to: ${variant.openTo}`);
  lines.push('');
  lines.push('SUMMARY');
  lines.push(summary);
  lines.push('');
  lines.push('EXPERIENCE');
  lines.push('');

  const currentEra = experience.filter((r) => r.dateRange.from >= CURRENT_ERA_FROM);
  const retrospective = experience.filter((r) => r.dateRange.from < CURRENT_ERA_FROM);

  for (const role of currentEra) {
    const slug = slugifyCompany(role.company);
    const dates = formatDateRange(role.dateRange.from, role.dateRange.to);
    const loc = `${role.location.city}, ${role.location.state}`;
    lines.push(`${role.company} — ${role.title} (${dates}, ${loc})`);
    if (role.description) lines.push(stripHtml(role.description));

    const override = roleOverrides.get(slug);

    if (role.impactBullets && role.impactBullets.length > 0) {
      const bExplicit = (override?.impactBulletIndices || []).filter(
        (i) => i >= 0 && i < role.impactBullets!.length
      );
      const bRemaining: number[] = [];
      for (let i = 0; i < role.impactBullets.length; i++) {
        if (!bExplicit.includes(i)) bRemaining.push(i);
      }
      const bOrder = [...bExplicit, ...bRemaining];
      lines.push('');
      lines.push('Impact:');
      for (const idx of bOrder) {
        const bullet = role.impactBullets[idx];
        if (bullet) lines.push(`  • ${stripHtml(bullet)}`);
      }
    }
    lines.push('');
  }

  if (retrospective.length > 0) {
    lines.push('EARLIER ROLES (2004–2014)');
    for (const role of retrospective) {
      const dates = formatDateRange(role.dateRange.from, role.dateRange.to);
      lines.push(`  ${role.company} — ${role.title} (${dates})`);
    }
    lines.push('');
  }

  lines.push('SKILLS');
  const skills = deriveSkillsByCategory();
  const order = [
    'language',
    'framework',
    'platform',
    'ai',
    'tooling',
    'library',
    'protocol',
    'concept'
  ];
  for (const cat of order) {
    const list = skills[cat];
    if (!list) continue;
    const items = list
      .map((name) => (emphasizedLower.has(name.toLowerCase().trim()) ? `**${name}**` : name))
      .join(', ');
    lines.push(`${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${items}`);
  }

  return lines.join('\n');
}

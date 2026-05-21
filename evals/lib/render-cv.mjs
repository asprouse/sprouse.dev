// Pure-JS CV renderer: takes resume.json + an optional TailorPatch and
// produces a plain-text rendering equivalent to what a hiring manager would
// see on the print sheet. Used by the eval harness to feed before/after
// versions of the CV to the evaluator.
//
// Mirrors the apply-patch logic in src/lib/tailor-client.ts (project
// re-ranking, hiding, summary replacement) and the skills-derivation logic
// in src/lib/resume.ts (languages carry forward from retrospective era).
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const resumePath = join(__dirname, '../../resume.json');
export const resume = JSON.parse(await readFile(resumePath, 'utf8'));

const CURRENT_ERA_FROM = '2015-01';

const VARIANTS = {
  cto: {
    tagline: 'Twenty years shipping production software. Currently CTO. Looking next.',
    openTo:
      'Open to CTO at AI-native companies building primary AI products — applied AI, agent platforms, model-adjacent infrastructure.'
  },
  principal: {
    tagline: 'Twenty years designing primary primitives. IC-first, schema-shaped.',
    openTo:
      'Open to Principal / Staff Engineer roles at companies whose product is itself a primary primitive — LLM, runtime, commerce, payments.'
  },
  cofounder: {
    tagline: 'Two co-founder gigs in. Going application-first next time.',
    openTo:
      'Open to technical co-founder roles, application-first — pick a real user problem AI now makes solvable, ship it, and let the dev-tools fall out of the work.'
  }
};

function slugifyCompany(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function formatYearMonth(ym) {
  const [year, month] = ym.split('-');
  if (!month) return year;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function formatDateRange(from, to) {
  return `${formatYearMonth(from)} – ${to ? formatYearMonth(to) : 'Present'}`;
}

function deriveSkillsByCategory() {
  const usage = new Map();
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
  const byCategory = {};
  for (const [, tech] of usage) {
    if (!byCategory[tech.category]) byCategory[tech.category] = [];
    byCategory[tech.category].push(tech.name);
  }
  return byCategory;
}

export function renderCv({ patch = null, variantSlug } = {}) {
  const lensSlug = variantSlug || patch?.variant || 'cto';
  const variant = VARIANTS[lensSlug];
  const { person, experience } = resume;
  const fullName = `${person.first} ${person.last}`;
  const summary = patch?.summary || resume.summary;
  const emphasizedLower = new Set(
    (patch?.emphasizedSkills || []).map((s) => s.toLowerCase().trim())
  );

  const roleOverrides = new Map();
  for (const r of patch?.roles || []) roleOverrides.set(r.companySlug, r);

  const lines = [];
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
    lines.push('');

    const override = roleOverrides.get(slug);
    const hideSet = new Set(override?.hideProjectIndices || []);
    const explicit = (override?.projectIndices || []).filter(
      (i) => i >= 0 && i < role.projects.length && !hideSet.has(i)
    );
    const remaining = [];
    for (let i = 0; i < role.projects.length; i++) {
      if (hideSet.has(i)) continue;
      if (!explicit.includes(i)) remaining.push(i);
    }
    const order = [...explicit, ...remaining];

    for (const idx of order) {
      const p = role.projects[idx];
      const techNames = p.technologies
        .map((s) => resume.technologies[s]?.name || s)
        .join(', ');
      lines.push(`  • ${p.title || '(Untitled)'}`);
      lines.push(`    ${stripHtml(p.description)}`);
      if (techNames) lines.push(`    Technologies: ${techNames}`);
      lines.push('');
    }
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
  const order = ['language', 'framework', 'platform', 'ai', 'tooling', 'library', 'protocol', 'concept'];
  for (const cat of order) {
    if (!skills[cat]) continue;
    const items = skills[cat]
      .map((name) =>
        emphasizedLower.has(name.toLowerCase().trim()) ? `**${name}**` : name
      )
      .join(', ');
    lines.push(`${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${items}`);
  }

  return lines.join('\n');
}

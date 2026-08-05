// Self-contained React rendering of the print CV. Mirrors the markup and
// styles of src/pages/cv/print.astro so the ephemeral editor at /cv/edit
// can render arbitrary resume JSON without hitting the server.
//
// Kept intentionally standalone (inline <style>, no external CSS) so the
// existing /cv/print server-rendered page is unaffected.
import type { CSSProperties } from 'react';
import type { Resume, TechCategory, TechEntry } from '../types/resume';
import type { VariantSlug } from '../lib/variants';
import { CURRENT_ERA_FROM, slugifyCompany } from '../lib/slug';

interface Props {
  resume: Resume;
  lens: VariantSlug;
}

interface SkillUsage {
  slug: string;
  tech: TechEntry;
  projectCount: number;
  isCurrent: boolean;
}

const PRINT_GROUPS: { label: string; categories: TechCategory[] }[] = [
  { label: 'Languages', categories: ['language'] },
  { label: 'Frameworks', categories: ['framework'] },
  { label: 'AI / LLM', categories: ['ai'] },
  { label: 'Platforms', categories: ['platform'] },
  { label: 'Infrastructure & Tooling', categories: ['tooling', 'library'] },
  { label: 'Protocols & Concepts', categories: ['protocol', 'concept'] }
];

function deriveSkillsFrom(resume: Resume): Record<TechCategory, SkillUsage[]> {
  const usage = new Map<string, { count: number; current: boolean }>();
  for (const role of resume.experience) {
    const isRetro = role.dateRange.from < CURRENT_ERA_FROM;
    const isCurrent = role.dateRange.to === null;
    for (const project of role.projects) {
      for (const slug of project.technologies) {
        const tech = resume.technologies[slug];
        if (!tech) continue;
        if (isRetro && tech.category !== 'language') continue;
        const entry = usage.get(slug) ?? { count: 0, current: false };
        entry.count += 1;
        if (isCurrent) entry.current = true;
        usage.set(slug, entry);
      }
    }
  }
  const grouped: Record<TechCategory, SkillUsage[]> = {
    language: [],
    framework: [],
    library: [],
    platform: [],
    ai: [],
    tooling: [],
    protocol: [],
    concept: [],
    internal: [],
    humor: []
  };
  for (const [slug, data] of usage) {
    const tech = resume.technologies[slug];
    if (!tech) continue;
    grouped[tech.category].push({
      slug,
      tech,
      projectCount: data.count,
      isCurrent: data.current
    });
  }
  for (const category of Object.keys(grouped) as TechCategory[]) {
    grouped[category].sort((a, b) => {
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
      return b.projectCount - a.projectCount;
    });
  }
  return grouped;
}

function formatYearMonth(ym: string): string {
  const [year, month] = ym.split('-');
  if (!year) return ym;
  if (!month) return year;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function formatDateRange(from: string, to: string | null): string {
  return `${formatYearMonth(from)} – ${to ? formatYearMonth(to) : 'Present'}`;
}

export default function PrintCV({ resume, lens }: Props) {
  const { person, summary, experience, education, variants } = resume;
  const variant = variants[lens];
  const fullName = `${person.first} ${person.last}`;
  const currentRole = experience.find((r) => r.dateRange.to === null);
  const currentLine = currentRole ? `${currentRole.title} · ${currentRole.company}` : '';

  const currentEra = experience.filter((r) => r.dateRange.from >= CURRENT_ERA_FROM);
  const retrospective = experience.filter((r) => r.dateRange.from < CURRENT_ERA_FROM);

  const derived = deriveSkillsFrom(resume);
  const skillGroups = PRINT_GROUPS.map((g) => ({
    label: g.label,
    items: g.categories.flatMap((c) => derived[c].map((s) => s.tech.name))
  })).filter((g) => g.items.length > 0);

  // openTo is a site-view filter, not application-appropriate. See print.astro.
  const summaryText = currentRole ? variant.tagline : summary;

  return (
    <>
      <style>{PRINT_CV_STYLES}</style>
      <article className="print-cv-page">
        <header className="cv-hero">
          <h1>{fullName}</h1>
          <p className="role-line">
            {currentLine} · {person.location.city}, {person.location.state}
          </p>
          <p className="contact">
            <a href={`mailto:${person.email}`}>{person.email}</a>
            {' · '}
            <a href={person.links.github}>github.com/asprouse</a>
            {' · '}
            <a href={person.links.linkedin}>linkedin.com/in/andrew-sprouse</a>
            {' · '}
            <a href={person.links.website}>sprouse.dev</a>
          </p>
          <p className="summary">{summaryText}</p>
        </header>

        <section>
          <h2 className="section">Experience</h2>
          {currentEra.map((role) => (
            <div className="role" key={slugifyCompany(role.company) + role.dateRange.from}>
              <div className="role-header">
                <span className="role-name">{role.company}</span>
                <span className="role-meta">
                  {formatDateRange(role.dateRange.from, role.dateRange.to)} · {role.location.city},{' '}
                  {role.location.state}
                </span>
              </div>
              <p className="role-title-line">{role.title}</p>
              {role.description && (
                <p
                  className="role-summary"
                  dangerouslySetInnerHTML={{ __html: role.description }}
                />
              )}
              {role.impactBullets && role.impactBullets.length > 0 && (
                <ul className="impact-bullets">
                  {role.impactBullets.map((bullet, idx) => (
                    <li
                      className="impact-bullet"
                      key={idx}
                      style={{ order: idx } as CSSProperties}
                      dangerouslySetInnerHTML={{ __html: bullet }}
                    />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>

        {retrospective.length > 0 && (
          <section>
            <h2 className="section">Career retrospective ({formatYearRange(retrospective)})</h2>
            {retrospective.map((role) => (
              <div className="retro-row" key={slugifyCompany(role.company) + role.dateRange.from}>
                <span>
                  <span className="retro-name">{role.company}</span>{' '}
                  <span className="retro-title">— {role.title}</span>
                </span>
                <span className="retro-meta">
                  {formatDateRange(role.dateRange.from, role.dateRange.to)} · {role.location.city},{' '}
                  {role.location.state}
                </span>
              </div>
            ))}
          </section>
        )}

        <section>
          <h2 className="section">Skills</h2>
          {skillGroups.map((g) => (
            <p className="skill-row" key={g.label}>
              <span className="skill-label">{g.label}</span>
              {g.items.map((item, idx) => (
                <span key={item + idx}>
                  <span className="skill-item">{item}</span>
                  {idx < g.items.length - 1 && <span className="skill-sep"> · </span>}
                </span>
              ))}
            </p>
          ))}
        </section>

        <section>
          <h2 className="section">Education</h2>
          {education.map((e) => (
            <p className="edu-row" key={e.school + e.date}>
              <strong>{e.degree}</strong>, {e.school}
              {e.honors && e.honors.length > 0 && <> — {e.honors.join(', ')}</>}
              {' · '}
              {e.date}
            </p>
          ))}
        </section>
      </article>
    </>
  );
}

function formatYearRange(roles: Resume['experience']): string {
  if (roles.length === 0) return '';
  const froms = roles.map((r) => r.dateRange.from.slice(0, 4)).sort();
  const tos = roles
    .map((r) => (r.dateRange.to ?? new Date().getFullYear().toString()).slice(0, 4))
    .sort();
  return `${froms[0]}–${tos[tos.length - 1]}`;
}

const PRINT_CV_STYLES = `
  .print-cv-page {
    --cv-ink: #0c0a09;
    --cv-muted: #57534e;
    --cv-rule: #d6d3d1;
    --cv-brand: var(--color-brand, #b45309);
    box-sizing: border-box;
    background: #ffffff;
    color: var(--cv-ink);
    font-family: 'Inter Variable', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    font-feature-settings: 'ss01', 'cv11';
    font-size: 10.5pt;
    line-height: 1.4;
    -webkit-font-smoothing: antialiased;
    padding: 0.55in 0.6in;
    max-width: 8.5in;
    margin: 0 auto;
  }
  .print-cv-page *, .print-cv-page *::before, .print-cv-page *::after {
    box-sizing: border-box;
  }
  .print-cv-page a { color: inherit; text-decoration: none; }
  .print-cv-page .cv-hero { margin-bottom: 1.1em; }
  .print-cv-page h1 {
    margin: 0 0 0.15em;
    font-size: 24pt;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.05;
  }
  .print-cv-page .role-line {
    margin: 0 0 0.35em;
    font-size: 11.5pt;
    color: var(--cv-muted);
  }
  .print-cv-page .contact {
    margin: 0;
    font-size: 10pt;
    color: var(--cv-muted);
  }
  .print-cv-page .contact a { color: var(--cv-ink); }
  .print-cv-page .summary {
    margin: 1em 0 0;
    font-size: 10.5pt;
    line-height: 1.5;
  }
  .print-cv-page h2.section {
    margin: 1.4em 0 0.4em;
    padding-bottom: 0.2em;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--cv-muted);
    border-bottom: 1px solid var(--cv-rule);
    break-after: avoid-page;
    page-break-after: avoid;
  }
  .print-cv-page .role { margin: 0.7em 0 1em; }
  .print-cv-page .role-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 0.15em;
    break-after: avoid-page;
    page-break-after: avoid;
  }
  .print-cv-page .role-name {
    font-size: 11.5pt;
    font-weight: 700;
    letter-spacing: -0.005em;
  }
  .print-cv-page .role-meta {
    font-size: 9.5pt;
    color: var(--cv-muted);
    white-space: nowrap;
  }
  .print-cv-page .role-title-line {
    margin: 0 0 0.45em;
    font-size: 10pt;
    color: var(--cv-muted);
    font-style: italic;
  }
  .print-cv-page .role-summary {
    margin: 0.35em 0 0.55em;
    font-size: 10pt;
  }
  .print-cv-page .role-summary a {
    color: var(--cv-ink);
    text-decoration: underline;
    text-decoration-color: var(--cv-rule);
  }
  .print-cv-page .impact-bullets {
    list-style: disc;
    display: flex;
    flex-direction: column;
    margin: 0.4em 0 0.7em;
    padding-left: 1.4em;
    font-size: 10pt;
    line-height: 1.4;
  }
  .print-cv-page .impact-bullets li { margin: 0.25em 0; }
  .print-cv-page .impact-bullets li::marker { color: var(--cv-brand); }
  .print-cv-page .retro-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin: 0.3em 0;
    font-size: 9.5pt;
  }
  .print-cv-page .retro-name { font-weight: 600; }
  .print-cv-page .retro-meta { color: var(--cv-muted); white-space: nowrap; }
  .print-cv-page .retro-title { color: var(--cv-muted); }
  .print-cv-page .skill-row { margin: 0.25em 0; font-size: 10pt; }
  .print-cv-page .skill-label {
    font-weight: 600;
    color: var(--cv-muted);
    display: inline-block;
    min-width: 11em;
  }
  .print-cv-page .edu-row { margin: 0.3em 0; font-size: 10pt; }
  .print-cv-page .edu-row strong { font-weight: 600; }

  @media print {
    /* @page supplies the paper margins; drop the on-screen padding so we
       don't stack margin + padding and lose a page's worth of vertical. */
    .print-cv-page {
      padding: 0;
      max-width: none;
      margin: 0;
    }
  }

  @media (max-width: 720px) {
    .print-cv-page {
      font-size: 12pt;
      padding: 24px 20px;
      max-width: 100%;
    }
    .print-cv-page h1 { font-size: 22pt; }
    .print-cv-page h2.section { font-size: 9.5pt; margin-top: 1.6em; }
    .print-cv-page .role { margin: 1em 0 1.4em; }
    .print-cv-page .role-header { flex-wrap: wrap; gap: 4px 12px; }
    .print-cv-page .role-meta { font-size: 9pt; white-space: normal; }
    .print-cv-page .role-summary { font-size: 11pt; }
    .print-cv-page .skill-row { font-size: 11pt; }
    .print-cv-page .skill-label { display: block; min-width: 0; margin-bottom: 0.1em; }
    .print-cv-page .retro-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      margin: 0.55em 0;
      font-size: 11pt;
    }
    .print-cv-page .retro-meta { font-size: 9.5pt; white-space: normal; }
  }
`;

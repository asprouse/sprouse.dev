// All factual context for the tailor prompt is composed here from canonical
// sources (resume.json, chatbot/profile.md) so the prompt template itself
// holds only principles and instructions — never duplicated data that can
// drift from those sources.

import { CURRENT_ERA_FROM, resume, slugifyCompany } from '../resume';
import profileMd from '../../../chatbot/profile.md?raw';

export interface TailorContext {
  /** Printable technology names (display form) that appear anywhere in the
   *  resume. Mirrors what shows up in the SkillsMatrix component — languages
   *  carry forward from retrospective era; everything else is current-era. */
  skillVocabulary: string[];
  /** All roles formatted for the prompt, current AND retrospective. The
   *  model needs the retrospective tech stacks to reason about adjacent
   *  skills (e.g., Django at Ronik 2013 → Python adjacency). */
  roles: string;
  /** chatbot/profile.md body — career-spanning framings (player-coach,
   *  primary primitives, application-first thesis) and facts not always
   *  visible in role descriptions (Techstars Philadelphia, seed timing). */
  background: string;
}

function formatRoles(): string {
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

function buildSkillVocabulary(): string[] {
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

function extractBackground(): string {
  return profileMd.replace(/^---[\s\S]*?---\n+/, '').trim();
}

export function buildTailorContext(): TailorContext {
  return {
    skillVocabulary: buildSkillVocabulary(),
    roles: formatRoles(),
    background: extractBackground()
  };
}

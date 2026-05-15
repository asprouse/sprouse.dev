// Tiny standalone module so client-side code (Chat.tsx) can import the
// slugifier without pulling resume.json (44 KB) into the browser bundle.
export function slugifyCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Cutoff that splits the "current era" (since this date) from the
// "career retrospective" everywhere it shows up:
//   - Resume.astro grouping
//   - cv.astro grouping
//   - Skills derivation in lib/resume.ts
//   - Tailor prompt (only current-era roles are eligible for re-ranking)
export const CURRENT_ERA_FROM = '2015-01';

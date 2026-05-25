// AUTO-GENERATED — do not edit by hand.
// Source of truth: schemas/resume.schema.json
// Regenerate with: npm run gen:types

export type TechCategory =
  | 'language'
  | 'framework'
  | 'library'
  | 'platform'
  | 'ai'
  | 'tooling'
  | 'protocol'
  | 'concept'
  | 'internal'
  | 'humor';

/**
 * Canonical schema for the resume.json data file. Validated at build time; TypeScript types are generated from this schema into src/types/resume.ts.
 */
export interface Resume {
  $schema?: string;
  person: Person;
  /**
   * Canonical one-line elevator pitch shown on the homepage and OG image. Variant-specific taglines (variants[X].tagline) override per CV lens.
   */
  tagline: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  openSource: OpenSourceEntry[];
  /**
   * Map of tech slug to TechEntry. Slugs are lowercase, hyphen-separated.
   */
  technologies: {
    [k: string]: TechEntry;
  };
  /**
   * Positioning variants. Keys are variant slugs (cto, principal, cofounder).
   */
  variants: {
    cto: VariantEntry;
    principal: VariantEntry;
    cofounder: VariantEntry;
  };
}
export interface Person {
  first: string;
  last: string;
  email: string;
  location: Location;
  links: {
    website: string;
    linkedin: string;
    github: string;
  };
}
export interface Location {
  city: string;
  state: string;
}
export interface ExperienceEntry {
  company: string;
  title: string;
  location: Location;
  dateRange: DateRange;
  description: string;
  /**
   * Outcome-led summary of the role — what was driven and what it produced. 3–6 items, third-person resume tone, each lead with an action verb (Drove, Designed, Shipped, Led).
   *
   * @minItems 3
   * @maxItems 6
   */
  impactBullets?:
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string]
    | [string, string, string, string, string, string];
  projects: Project[];
}
export interface DateRange {
  /**
   * YYYY-MM format (e.g. '2018-10').
   */
  from: string;
  /**
   * YYYY-MM format, or null for the current role.
   */
  to: string | null;
}
export interface Project {
  title?: string;
  description: string;
  technologies: string[];
}
export interface EducationEntry {
  school: string;
  college?: string;
  location: Location;
  date: string;
  honors?: string[];
  degree: string;
  coursework?: string[];
}
export interface OpenSourceEntry {
  name: string;
  url: string;
  description: string;
}
export interface TechEntry {
  name: string;
  url: string;
  category: TechCategory;
  /**
   * Tooltip-style explanation. May be empty for techs whose name speaks for itself.
   */
  description: string;
}
export interface VariantEntry {
  /**
   * Human-readable lens name shown in UI (e.g., 'Principal Engineer').
   */
  label: string;
  /**
   * One-line elevator pitch shown under the H1.
   */
  tagline: string;
  /**
   * What kind of next role Andrew is open to under this lens.
   */
  openTo: string;
  metaTitle: string;
  metaDescription: string;
}

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

export interface Location {
    city: string;
    state: string;
}

export interface DateRange {
    from: string;
    to: string | null;
}

export interface Project {
    description: string;
    technologies: string[];
}

export interface ExperienceEntry {
    company: string;
    title: string;
    location: Location;
    dateRange: DateRange;
    description: string;
    projects: Project[];
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

export type TechCategory =
    | "language"
    | "framework"
    | "library"
    | "platform"
    | "ai"
    | "tooling"
    | "protocol"
    | "concept"
    | "internal"
    | "humor";

export interface TechEntry {
    name: string;
    url: string;
    category: TechCategory;
    description: string;
}

export interface Resume {
    person: {
        first: string;
        last: string;
        email: string;
        location: Location;
        links: {
            website: string;
            linkedin: string;
            github: string;
        };
    };
    summary: string;
    experience: ExperienceEntry[];
    education: EducationEntry[];
    openSource: OpenSourceEntry[];
    technologies: Record<string, TechEntry>;
}

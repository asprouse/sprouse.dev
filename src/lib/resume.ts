import resumeJson from "../../resume.json";
import type { Resume, TechCategory, TechEntry } from "../types/resume";

export const resume = resumeJson as unknown as Resume;

export function formatDateRange(from: string, to: string | null): string {
    return `${formatYearMonth(from)} – ${to ? formatYearMonth(to) : "Present"}`;
}

function formatYearMonth(ym: string): string {
    const [year, month] = ym.split("-");
    if (!month) return year;
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export interface SkillUsage {
    slug: string;
    tech: TechEntry;
    projectCount: number;
    companies: string[];
    isCurrent: boolean;
}

export function deriveSkills(): Record<TechCategory, SkillUsage[]> {
    const usage = new Map<string, { count: number; companies: Set<string>; current: boolean }>();

    for (const role of resume.experience) {
        const isCurrent = role.dateRange.to === null;
        for (const project of role.projects) {
            for (const slug of project.technologies) {
                const entry = usage.get(slug) ?? { count: 0, companies: new Set(), current: false };
                entry.count += 1;
                entry.companies.add(role.company);
                if (isCurrent) entry.current = true;
                usage.set(slug, entry);
            }
        }
    }

    const grouped: Record<TechCategory, SkillUsage[]> = {
        language: [], framework: [], library: [], platform: [],
        ai: [], tooling: [], protocol: [], concept: [],
        internal: [], humor: [],
    };

    for (const [slug, data] of usage) {
        const tech = resume.technologies[slug];
        if (!tech) continue;
        grouped[tech.category].push({
            slug,
            tech,
            projectCount: data.count,
            companies: Array.from(data.companies),
            isCurrent: data.current,
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

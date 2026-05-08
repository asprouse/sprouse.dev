export interface QAEntry {
    id: string;
    category: string;
    categoryTitle: string;
    tags: string[];
    question: string;
    answer: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]+?)\r?\n---\r?\n/;
const METADATA_RE = /<!--\s*id:\s*([\w-]+)\s*\|\s*tags:\s*\[([^\]]*)\]\s*-->/g;

function extractField(frontmatter: string, key: string): string {
    const m = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return m ? m[1].trim() : "";
}

export function parseQACorpus(files: Record<string, string>): QAEntry[] {
    const all: QAEntry[] = [];
    const sortedPaths = Object.keys(files).sort();
    for (const path of sortedPaths) {
        all.push(...parseFile(files[path]));
    }
    return all;
}

function parseFile(content: string): QAEntry[] {
    const fmMatch = content.match(FRONTMATTER_RE);
    if (!fmMatch) return [];
    const fm = fmMatch[1];
    const category = extractField(fm, "category");
    const categoryTitle = extractField(fm, "title");
    if (!category) return [];

    const body = content.slice(fmMatch[0].length);
    const matches = [...body.matchAll(METADATA_RE)];
    const entries: QAEntry[] = [];

    for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        const next = matches[i + 1];
        const blockStart = m.index! + m[0].length;
        const blockEnd = next ? next.index! : body.length;
        const block = body.slice(blockStart, blockEnd);

        // First non-empty line should be the heading: `## N. Question text?`
        const headingMatch = block.match(/^[ \t]*##\s+(?:\d+\.\s+)?(.+?)[ \t]*$/m);
        if (!headingMatch) continue;
        const question = headingMatch[1].trim();

        // Answer is everything after the heading line, trimmed
        const headingIdx = block.indexOf(headingMatch[0]);
        const afterHeading = block.slice(headingIdx + headingMatch[0].length);
        const answer = afterHeading.trim();
        if (!answer) continue; // skip unanswered

        const id = m[1];
        const tags = m[2]
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        entries.push({
            id,
            category,
            categoryTitle,
            tags,
            question,
            answer,
        });
    }
    return entries;
}

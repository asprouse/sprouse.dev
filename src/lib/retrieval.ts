import type { QAEntry } from "./qa-corpus";

const STOPWORDS = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "of", "in", "on", "at", "to",
    "for", "with", "by", "about", "as", "and", "or", "but", "not", "this",
    "that", "these", "those", "i", "you", "he", "she", "it", "we", "they",
    "my", "your", "his", "her", "its", "our", "their", "me", "him", "us",
    "them", "what", "when", "where", "who", "why", "how", "which", "so",
    "if", "then", "than", "just", "also", "really", "from", "into", "out",
    "up", "down", "over", "under", "again", "more", "most", "any", "some",
    "each", "all", "few", "very", "very", "such", "no", "yes",
]);

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

interface IndexedEntry {
    entry: QAEntry;
    tf: Map<string, number>;
    length: number;
}

export interface QAIndex {
    indexed: IndexedEntry[];
    df: Map<string, number>;
    N: number;
    avgLen: number;
}

export interface RetrievalResult {
    entry: QAEntry;
    score: number;
}

export function buildIndex(entries: QAEntry[]): QAIndex {
    const indexed: IndexedEntry[] = entries.map((entry) => {
        // Weight question higher by repeating it; tags also boosted
        const text = `${entry.question} ${entry.question} ${entry.tags.join(" ")} ${entry.tags.join(" ")} ${entry.answer}`;
        const tokens = tokenize(text);
        const tf = new Map<string, number>();
        for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
        return { entry, tf, length: tokens.length };
    });

    const df = new Map<string, number>();
    for (const ie of indexed) {
        for (const t of ie.tf.keys()) {
            df.set(t, (df.get(t) || 0) + 1);
        }
    }

    const N = indexed.length;
    const avgLen = N > 0 ? indexed.reduce((s, ie) => s + ie.length, 0) / N : 0;

    return { indexed, df, N, avgLen };
}

const K1 = 1.5;
const B = 0.75;

export function retrieve(
    index: QAIndex,
    query: string,
    k: number = 5,
): RetrievalResult[] {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const { indexed, df, N, avgLen } = index;
    const results: RetrievalResult[] = indexed.map((ie) => {
        let score = 0;
        for (const qt of queryTokens) {
            const tf = ie.tf.get(qt);
            if (!tf) continue;
            const dfVal = df.get(qt) || 0;
            const idf = Math.log((N - dfVal + 0.5) / (dfVal + 0.5) + 1);
            const norm = (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (ie.length / avgLen)));
            score += idf * norm;
        }
        return { entry: ie.entry, score };
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k).filter((r) => r.score > 0);
}

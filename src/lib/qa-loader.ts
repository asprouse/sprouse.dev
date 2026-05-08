import { parseQACorpus, type QAEntry } from "./qa-corpus";

const rawFiles = import.meta.glob("../../chatbot/qa/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
}) as Record<string, string>;

export const corpus: QAEntry[] = parseQACorpus(rawFiles);

const profileMd = (await import("../../chatbot/profile.md?raw")).default;
export const profile: string = profileMd;

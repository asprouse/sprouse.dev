import type { QAEntry } from './qa-corpus';
import { generatedCorpus } from './qa-corpus.generated';

// Corpus is pre-parsed at build time by scripts/gen-qa-corpus.mjs so the
// worker doesn't have to run regex-based markdown parsing on every cold
// start. The .generated file is gitignored; predev / prebuild / pretypecheck
// regen it from andrew/qa/*.md.
export const corpus: QAEntry[] = generatedCorpus;

// profile.md is a single small string; the ?raw import is effectively free
// (no parsing, just a string literal in the bundle). Not worth the build
// step indirection.
const profileMd = (await import('../../andrew/profile.md?raw')).default;
export const profile: string = profileMd;

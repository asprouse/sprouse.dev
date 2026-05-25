#!/usr/bin/env node
// Generates src/types/resume.ts from schemas/resume.schema.json.
// Run via `npm run gen:types`. The generated file is committed so that
// type-aware editing works without requiring a generate step on every clone.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compile, type JSONSchema } from 'json-schema-to-typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const schemaPath = join(repoRoot, 'schemas/resume.schema.json');
const outPath = join(repoRoot, 'src/types/resume.ts');

const schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as JSONSchema;

const banner = `// AUTO-GENERATED — do not edit by hand.
// Source of truth: schemas/resume.schema.json
// Regenerate with: npm run gen:types`;

const ts = await compile(schema, 'Resume', {
  bannerComment: banner,
  style: { singleQuote: true, semi: true, tabWidth: 2 },
  additionalProperties: false,
  unreachableDefinitions: false
});

writeFileSync(outPath, ts);
console.log(`✓ wrote ${outPath}`);

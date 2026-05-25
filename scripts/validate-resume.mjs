#!/usr/bin/env node
// Validates andrew/cv.yml against schemas/resume.schema.json using Ajv.
// Runs as part of `npm run check` and CI. Exits 1 on validation failure.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import yaml from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const schemaPath = join(repoRoot, 'schemas/resume.schema.json');
const dataPath = join(repoRoot, 'andrew/cv.yml');

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const data = yaml.parse(readFileSync(dataPath, 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats.default(ajv);

const validate = ajv.compile(schema);

if (validate(data)) {
  console.log('✓ andrew/cv.yml is valid against schemas/resume.schema.json');
  process.exit(0);
}

console.error('✗ andrew/cv.yml failed validation:');
for (const err of validate.errors ?? []) {
  const path = err.instancePath || '(root)';
  console.error(`  ${path}: ${err.message}`);
  if (err.params && Object.keys(err.params).length) {
    console.error(`    params: ${JSON.stringify(err.params)}`);
  }
}
process.exit(1);

// Tailor eval harness.
//
// 1. Loads a JD file from evals/jds/<file>.md
// 2. Renders the untailored CV (default lens)
// 3. Posts the JD to the dev server's /api/tailor endpoint to get a patch
// 4. Renders the tailored CV (with patch applied + variant lens)
// 5. Evaluates both N times each with the same hiring-manager rubric
// 6. Prints before/after scores + the tailor's rationale
//
// Usage:
//   npm run dev                                  # in another terminal
//   npm run eval:tailor                          # uses default JD
//   npm run eval:tailor anthropic-senior-staff-api.md
//   N_RUNS=5 npm run eval:tailor
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCv } from './lib/render-cv.mjs';
import { evaluate } from './lib/evaluator.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const jdName = process.argv[2] || 'anthropic-senior-staff-api.md';
const jdPath = join(__dirname, 'jds', jdName);
const TAILOR_URL = process.env.TAILOR_URL || 'http://localhost:4321/api/tailor';
const N_RUNS = Number(process.env.N_RUNS || 3);

async function postTailor(jd) {
  const res = await fetch(TAILOR_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jobDescription: jd })
  });
  if (!res.ok) {
    throw new Error(`Tailor failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function avg(scores) {
  return scores.reduce((s, x) => s + x.rating, 0) / scores.length;
}

function bar(score) {
  const filled = Math.round(score);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

async function main() {
  const jd = await readFile(jdPath, 'utf8');
  console.log(`JD:        ${jdName}`);
  console.log(`Tailor:    ${TAILOR_URL}`);
  console.log(`Runs/side: ${N_RUNS}`);
  console.log('');

  // Step 1: render untailored
  const beforeCv = renderCv();

  // Step 2: fetch tailor patch
  console.log('→ Fetching tailor patch...');
  const patch = await postTailor(jd);
  console.log(
    `  variant=${patch.variant}  skills=${patch.emphasizedSkills.length}  reordered=${patch.roles.length}`
  );
  console.log(`  tailor rationale: ${patch.rationale}`);
  console.log('');

  // Step 3: render tailored
  const afterCv = renderCv({ patch, variantSlug: patch.variant });

  // Step 4: evaluate
  console.log(`→ Evaluating before (${N_RUNS} runs)...`);
  const beforeScores = await Promise.all(
    Array.from({ length: N_RUNS }, () => evaluate({ jd, cv: beforeCv }))
  );
  console.log(`→ Evaluating after  (${N_RUNS} runs)...`);
  const afterScores = await Promise.all(
    Array.from({ length: N_RUNS }, () => evaluate({ jd, cv: afterCv }))
  );

  const beforeAvg = avg(beforeScores);
  const afterAvg = avg(afterScores);
  const delta = afterAvg - beforeAvg;

  console.log('');
  console.log('═══ BEFORE (no patch) ═══');
  beforeScores.forEach((s, i) =>
    console.log(`  run ${i + 1}: ${s.rating}/10  ${bar(s.rating)}  ${s.rationale}`)
  );
  console.log(`  avg:    ${beforeAvg.toFixed(2)}/10`);
  console.log('');
  console.log('═══ AFTER (tailored) ═══');
  afterScores.forEach((s, i) =>
    console.log(`  run ${i + 1}: ${s.rating}/10  ${bar(s.rating)}  ${s.rationale}`)
  );
  console.log(`  avg:    ${afterAvg.toFixed(2)}/10`);
  console.log('');
  console.log(`Δ      ${delta >= 0 ? '+' : ''}${delta.toFixed(2)} points`);

  // Step 5: save run artifact
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = join(__dirname, 'runs');
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, `${stamp}-${jdName.replace(/\.md$/, '')}.json`);
  await writeFile(
    outPath,
    JSON.stringify(
      {
        jd: jdName,
        nRuns: N_RUNS,
        patch,
        beforeScores,
        afterScores,
        beforeAvg,
        afterAvg,
        delta,
        beforeCv,
        afterCv
      },
      null,
      2
    )
  );
  console.log(`\nSaved: evals/runs/${stamp}-${jdName.replace(/\.md$/, '')}.json`);
}

main().catch((err) => {
  console.error('\nEval failed:', err.message);
  process.exit(1);
});

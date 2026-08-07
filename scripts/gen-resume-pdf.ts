// Renders a resume to a PDF via headless Chromium.
// Requires a dev server running at http://localhost:4321 (npm run dev).
//
// Without --json, prints /cv/print?lens=X directly.
// With --json <path>, seeds /cv/edit's localStorage with the tailored
// resume JSON and prints the live preview (matching the manual /cv/edit
// workflow but headless).
//
// Usage:
//   npm run gen:resume-pdf                                    # cto lens, base cv.yml
//   npm run gen:resume-pdf -- --lens principal
//   npm run gen:resume-pdf -- --json /tmp/foo.json --out cover-letters/foo.pdf
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const DEV_URL = process.env.DEV_URL || 'http://localhost:4321';
const VALID_LENSES = ['cto', 'principal', 'cofounder'];

function parseArgs(argv: string[]): { lens: string; out: string; jsonPath: string } {
  let lens = 'cto';
  let out = '';
  let jsonPath = '';
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--lens' && argv[i + 1]) {
      lens = argv[i + 1]!;
      i++;
    } else if (argv[i] === '--out' && argv[i + 1]) {
      out = argv[i + 1]!;
      i++;
    } else if (argv[i] === '--json' && argv[i + 1]) {
      jsonPath = argv[i + 1]!;
      i++;
    }
  }
  if (!VALID_LENSES.includes(lens)) {
    console.error(`Invalid lens "${lens}". Must be one of: ${VALID_LENSES.join(', ')}`);
    process.exit(1);
  }
  if (!out) out = 'cover-letters/Andrew-Sprouse-Resume.pdf';
  return { lens, out, jsonPath };
}

const { lens, out, jsonPath } = parseArgs(process.argv);
const targetPath = jsonPath ? '/cv/edit' : '/cv/print';
const url = `${DEV_URL}${targetPath}?lens=${lens}`;
console.log(`→ Rendering ${url}${jsonPath ? ` with tailored JSON ${jsonPath}` : ''}...`);

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();

  if (jsonPath) {
    const json = await readFile(jsonPath, 'utf8');
    // Load same-origin page first so localStorage is writable, seed the
    // editor state, then navigate to /cv/edit so CvEditor picks it up on mount.
    await page.goto(`${DEV_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((value: string) => {
      window.localStorage.setItem('cv-editor:resume-json', value);
    }, json);
  }

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  } catch (err) {
    console.error(`Failed to reach ${url}. Is the dev server running (npm run dev)?`);
    console.error((err as Error).message);
    process.exit(1);
  }
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: out,
    format: 'Letter',
    printBackground: true,
    preferCSSPageSize: true
  });
} finally {
  await browser.close();
}
console.log(`✓ Wrote ${out}`);

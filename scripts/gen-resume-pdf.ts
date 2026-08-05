// Renders /cv/print?lens=X to a PDF via headless Chromium.
// Requires a dev server running at http://localhost:4321 (npm run dev).
//
// Usage:
//   npm run gen:resume-pdf                        # cto lens, default filename
//   npm run gen:resume-pdf -- --lens principal
//   npm run gen:resume-pdf -- --out cover-letters/andrew-sprouse-datadog.pdf
import { chromium } from 'playwright';

const DEV_URL = process.env.DEV_URL || 'http://localhost:4321';
const VALID_LENSES = ['cto', 'principal', 'cofounder'];

function parseArgs(argv: string[]): { lens: string; out: string } {
  let lens = 'cto';
  let out = '';
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--lens' && argv[i + 1]) {
      lens = argv[i + 1]!;
      i++;
    } else if (argv[i] === '--out' && argv[i + 1]) {
      out = argv[i + 1]!;
      i++;
    }
  }
  if (!VALID_LENSES.includes(lens)) {
    console.error(`Invalid lens "${lens}". Must be one of: ${VALID_LENSES.join(', ')}`);
    process.exit(1);
  }
  if (!out) out = 'cover-letters/Andrew-Sprouse-Resume.pdf';
  return { lens, out };
}

const { lens, out } = parseArgs(process.argv);
const url = `${DEV_URL}/cv/print?lens=${lens}`;
console.log(`→ Rendering ${url}...`);

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
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

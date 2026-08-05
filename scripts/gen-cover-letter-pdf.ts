// Renders a cover letter markdown file to a properly-formatted letter PDF.
//
// Reads `## Cover Letter` section from the source markdown, wraps in a
// clean letter template (header block with contact info, date, recipient,
// signature), and prints via headless Chromium.
//
// Usage:
//   npm run gen:cover-letter-pdf cover-letters/artsy-artnet-cto.md \
//     --company "Artsy and Artnet" --greeting "Dear Hiring Team"
//
// Output: <same-basename>.pdf next to the source markdown.
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { chromium } from 'playwright';
import yaml from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

interface Args {
  mdPath: string;
  company: string;
  greeting: string;
}

function parseArgs(argv: string[]): Args {
  const [, , mdArg, ...rest] = argv;
  if (!mdArg) {
    console.error(
      'Usage: npm run gen:cover-letter-pdf <path.md> [--company "Name"] [--greeting "Dear ..."]'
    );
    process.exit(1);
  }
  let company = 'Hiring Team';
  let greeting = 'Dear Hiring Team,';
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--company' && rest[i + 1]) {
      company = rest[i + 1]!;
      i++;
    } else if (rest[i] === '--greeting' && rest[i + 1]) {
      greeting = rest[i + 1]!;
      i++;
    }
  }
  return {
    mdPath: mdArg.startsWith('/') ? mdArg : join(root, mdArg),
    company,
    greeting
  };
}

function extractCoverLetter(md: string): string {
  const startRe = /^##\s+Cover Letter/im;
  const startMatch = md.match(startRe);
  if (!startMatch || startMatch.index === undefined) {
    throw new Error('No "## Cover Letter" section found in the markdown.');
  }
  const afterHeader = md.slice(startMatch.index + startMatch[0].length);
  const bodyStartRel = afterHeader.indexOf('\n') + 1;
  const rest = afterHeader.slice(bodyStartRel);
  const endRe = /^---\s*$|^##\s+/m;
  const endMatch = rest.match(endRe);
  const body = (endMatch && endMatch.index !== undefined ? rest.slice(0, endMatch.index) : rest)
    .replace(/^\s*_~\d+\s*words_\s*$/gim, '')
    .trim();
  return body;
}

async function loadPerson() {
  const yml = await readFile(join(root, 'andrew/cv.yml'), 'utf8');
  const cv = yaml.parse(yml) as {
    person: {
      first: string;
      last: string;
      email: string;
      location: { city: string; state: string };
      links: { website: string; linkedin: string; github: string };
    };
  };
  return cv.person;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function buildHtml(opts: {
  bodyHtml: string;
  company: string;
  greeting: string;
  person: Awaited<ReturnType<typeof loadPerson>>;
}): string {
  const { bodyHtml, company, greeting, person } = opts;
  const fullName = `${person.first} ${person.last}`;
  const location = `${person.location.city}, ${person.location.state}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${fullName} — Cover Letter — ${company}</title>
    <style>
      @page {
        size: letter;
        margin: 0.5in 0.75in;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        color: #0c0a09;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', Arial, sans-serif;
        font-size: 10.5pt;
        line-height: 1.45;
      }
      header.letter-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        margin-bottom: 0.3in;
        border-bottom: 1px solid #d6d3d1;
        padding-bottom: 10px;
      }
      .sender h1 {
        margin: 0 0 3px;
        font-size: 14pt;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .sender .contact {
        font-size: 9pt;
        color: #57534e;
        line-height: 1.45;
      }
      .sender .contact a {
        color: inherit;
        text-decoration: none;
      }
      .date {
        font-size: 9.5pt;
        color: #57534e;
        white-space: nowrap;
        padding-top: 3px;
      }
      .recipient {
        margin: 0 0 0.2in;
        font-size: 10pt;
        color: #0c0a09;
      }
      .greeting {
        margin: 0 0 0.15in;
        font-size: 10.5pt;
      }
      .body p {
        margin: 0 0 0.7em;
      }
      .signoff {
        margin: 0.25in 0 0;
      }
      .signoff .close {
        margin: 0 0 0.4in;
      }
      .signoff .name {
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <header class="letter-header">
      <div class="sender">
        <h1>${fullName}</h1>
        <div class="contact">
          ${location}<br />
          <a href="mailto:${person.email}">${person.email}</a><br />
          <a href="${person.links.website}">${stripProtocol(person.links.website)}</a> ·
          <a href="${person.links.linkedin}">${stripProtocol(person.links.linkedin)}</a>
        </div>
      </div>
      <div class="date">${formatDate()}</div>
    </header>

    <p class="recipient">${company}</p>
    <p class="greeting">${greeting}</p>

    <div class="body">${bodyHtml}</div>

    <div class="signoff">
      <p class="close">Sincerely,</p>
      <p class="name">${fullName}</p>
    </div>
  </body>
</html>`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const md = await readFile(args.mdPath, 'utf8');
  const body = extractCoverLetter(md);
  const bodyHtml = await marked.parse(body);
  const person = await loadPerson();
  const html = buildHtml({ bodyHtml, company: args.company, greeting: args.greeting, person });

  const outPath = args.mdPath.replace(/\.md$/i, '.pdf');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: outPath,
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true
    });
  } finally {
    await browser.close();
  }
  console.log(`✓ Wrote ${outPath.replace(root + '/', '')}`);
}

await main();

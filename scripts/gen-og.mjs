#!/usr/bin/env node
// Regenerates public/og.png from /og at 1200x630. Boots an astro dev server,
// takes the screenshot via headless Chromium, then tears down. Run after
// editing andrew.yml so the OG image reflects the current data.
//
// Usage:
//   npm run gen:og              # boots its own dev server
//   OG_URL=http://localhost:4321/og npm run gen:og   # reuses a running dev
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'public/og.png');

const DEFAULT_PORT = 4322;
const url = process.env.OG_URL || `http://localhost:${DEFAULT_PORT}/og`;
const useExisting = !!process.env.OG_URL;

async function waitForServer(targetUrl, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(targetUrl);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server at ${targetUrl} did not respond within ${timeoutMs}ms`);
}

let server;
if (!useExisting) {
  console.log('→ Booting astro dev on port', DEFAULT_PORT);
  server = spawn('npx', ['astro', 'dev', '--port', String(DEFAULT_PORT)], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'inherit']
  });
  // Drain stdout to prevent the child from blocking on a full pipe buffer.
  server.stdout.on('data', () => {});
  await waitForServer(url);
}

try {
  console.log('→ Loading', url);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  // Hide Astro's dev toolbar — it's a fixed-position web component at the
  // bottom-center of the viewport and would otherwise appear in the OG.
  await page.addStyleTag({
    content: 'astro-dev-toolbar, astro-dev-overlay { display: none !important; }'
  });
  // Wait for Inter Variable to finish loading so the screenshot uses it
  // rather than a system fallback font. The callback runs in the page's
  // browser context, not in Node, so `document` is a real global there.
  // eslint-disable-next-line no-undef
  await page.evaluate(() => document.fonts.ready);
  const buffer = await page.screenshot({
    clip: { x: 0, y: 0, width: 1200, height: 630 }
  });
  await browser.close();
  await writeFile(outPath, buffer);
  console.log(`✓ Wrote ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
} finally {
  if (server) server.kill('SIGTERM');
}

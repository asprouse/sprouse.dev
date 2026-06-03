// Crude but reliable text extraction for job-description pages. JD pages
// are heterogeneous (Greenhouse, Lever, Workday, custom WP themes, etc.),
// so we avoid Readability-style heuristics and just strip tags. The user
// reviews/edits the result in the dialog before tailoring, which is the
// real safety net for bad extraction.

const MAX_OUTPUT_CHARS = 50_000;

export function extractJdText(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim().replace(/\s+/g, ' ') ?? '';

  let stripped = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ');

  // Insert newlines at block-tag boundaries so prose isn't smushed.
  stripped = stripped
    .replace(/<\/(p|div|li|h[1-6]|tr|br)\s*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n');

  stripped = stripped.replace(/<[^>]+>/g, ' ');

  stripped = stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  stripped = stripped
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (stripped.length > MAX_OUTPUT_CHARS) {
    stripped = stripped.slice(0, MAX_OUTPUT_CHARS) + '…';
  }

  return { title, text: stripped };
}

# andrew/

Everything that defines Andrew lives here. Code lives in `src/` and reads from this directory; this directory has no code.

## Files

| File            | What it is                                                                                                                                                                | Who reads it                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `cv.yml`        | Structured CV — person, tagline, experience, education, openSource, technologies, and the three positioning variants. Validated against `schemas/resume.schema.json`.     | `/`, `/cv`, `/cv/print`, OG image, eval harness, LinkedIn export, tailor prompt context |
| `profile.md`    | Narrative facts — hometown, family, co-founders, education backstory, Andrew's recurring phrases and framings, next-role shape. Not derivable from `cv.yml`.              | Chatbot (always-on prompt context), tailor prompt context                               |
| `qa/`           | Q&A corpus (~150 entries across 6 categories). One markdown file per category, each Q&A pair tagged with id + tags via HTML comments. Source of truth for the chatbot.    | Chatbot RAG retrieval                                                                   |
| `leadership.md` | Distilled 5-theme summary of `qa/04-leadership.md`, rendered as the "How I run things" section on `/cv`. Derived by `npm run gen:leadership` but can also be hand-edited. | `/cv` (`LeadershipPhilosophy.astro`)                                                    |
| `APPROACH.md`   | Methodology document — how the chatbot works (Q&A-over-RAG-over-blog, BM25, etc.). Rendered at `/about-the-bot`.                                                          | `/about-the-bot`                                                                        |

## Editing flow

When you change something here:

- **`cv.yml`** → run `npm run validate:resume` to confirm the schema still passes. If you change the variants' tagline or openTo, also run `npm run gen:og` to refresh `public/og.png`. If you change anything material, re-run `npm run eval:tailor` to see whether tailored CV scores shifted.
- **`profile.md`** → no validation; chatbot picks it up at next build. The tailor prompt also injects this, so a change here changes summaries the tailor can produce.
- **`qa/*.md`** → parsed at build time; new entries appear in chatbot retrieval automatically. If you change `04-leadership.md`, the `/cv` leadership section won't update until you run `npm run gen:leadership` (or hand-edit `leadership.md`).
- **`leadership.md`** → either regenerate from `qa/04-leadership.md` via `npm run gen:leadership`, or hand-edit directly.
- **`APPROACH.md`** → renders at `/about-the-bot` on next build. No other consumers.

## What's _not_ here

- Resume schema lives in `schemas/resume.schema.json` (so multiple data files could share it if needed)
- Portrait images live in `src/assets/` (Astro's `<Image>` pipeline requires `src/`, not `public/`)
- Generated artifacts that other tools write: `linkedin.md` (from `npm run gen:linkedin`), `public/og.png` (from `npm run gen:og`), `tailor-prompt.dump.txt` (from `npm run inspect:tailor-prompt`), `cover-letters/*.md` (from `npm run gen:application`)

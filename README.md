# sprouse.dev

Source for [sprouse.dev](https://sprouse.dev) — Andrew Sprouse's interactive resume site.

## What's here

- **`resume.json`** — canonical career data, the source of truth.
- **`src/`** — Astro 5 + React 19 + Tailwind v4 site. Three archetype landing pages (`/`, `/principal`, `/cofounder`) backed by a single `Resume` template.
- **`chatbot/`** — Q&A corpus and methodology for the in-page chatbot. Each markdown file is a category; questions are parsed at build time, retrieved by BM25, and grounded by a persona prompt + `chatbot/profile.md`.
- **`illustration/`** — source files for the hover-reveal portrait (illustration, original photo, GPT prompt).

## Running locally

```bash
npm install
cp .dev.vars.example .dev.vars  # then add your ANTHROPIC_API_KEY
npm run dev
```

Open `http://localhost:4321`.

## Deployment

Cloudflare Pages, auto-deployed on push to `master`. The chat endpoint runs on Cloudflare Workers via the `@astrojs/cloudflare` adapter; `ANTHROPIC_API_KEY` is set as a secret in the Pages project.

## How the chatbot works

Methodology lives at [`chatbot/APPROACH.md`](chatbot/APPROACH.md) and is rendered at [`/about-the-bot`](https://sprouse.dev/about-the-bot) on the live site.

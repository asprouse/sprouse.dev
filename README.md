# sprouse.dev

Source for [sprouse.dev](https://sprouse.dev) — Andrew Sprouse's interactive resume site.

It's also intended to be a forkable example of a small but production-grade modern stack: Astro 5 + React 19 + Tailwind v4 deployed to Cloudflare Workers, with an in-page chatbot powered by the Vercel AI SDK and a JD-driven tailored-CV flow. MIT-licensed — fork it freely.

---

## What's here

| Path               | What it is                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `resume.json`      | Canonical career data — the source of truth for everything rendered on the site                    |
| `schemas/`         | JSON Schema (`resume.schema.json`) that validates `resume.json` and codegens `src/types/resume.ts` |
| `src/pages/`       | Routes. `/` `/principal` `/cofounder` are three positioning variants; `/cv` is the printable CV    |
| `src/components/`  | Astro components for layout + React islands for `Chat.tsx` and `TailorPanel.tsx`                   |
| `src/lib/`         | Resume helpers, BM25 retrieval, chat/tailor prompts                                                |
| `src/pages/api/`   | `/api/chat` (streaming Claude responses), `/api/tailor` (JD-driven CV re-rank)                     |
| `chatbot/`         | Q&A corpus (`qa/*.md`), persona (`profile.md`), and methodology (`APPROACH.md`)                    |
| `public/`          | Static assets — favicon, OG image, portrait illustration                                           |
| `wrangler.jsonc`   | Cloudflare Workers config including the rate-limit bindings                                        |
| `astro.config.mjs` | Astro + Cloudflare adapter, sitemap, React aliasing for the Edge runtime                           |

## Architecture at a glance

```
┌─ resume.json ──────────── source of truth (validated against JSON Schema)
│  └─ src/types/resume.ts (auto-generated)
│
├─ chatbot/
│   ├─ profile.md ──────── persona + voice rules
│   ├─ qa/*.md ─────────── Q&A corpus (~150 entries across 6 categories)
│   └─ APPROACH.md ─────── methodology, rendered at /about-the-bot
│
├─ Astro routes
│   ├─ /, /principal, /cofounder ─ three positioning variants of the resume
│   ├─ /cv ─ print-first CV (Cmd+P → save as PDF), with tailor-on-JD panel
│   └─ /about-the-bot ─ how the chatbot works
│
└─ React islands
    ├─ Chat.tsx ──────── floating chat with tools (scroll_to_role, expand_role, …)
    └─ TailorPanel.tsx ─ JD → /api/tailor → URL-hash-encoded patch → DOM mutation
```

Three positioning **variants** (`src/lib/variants.ts`) let the resume re-frame itself for different audiences. Each variant has its own headline, "open to" line, and SEO meta, but the experience/skills/education content is shared.

The **tailor flow** is a deliberate experiment: paste a JD, the model returns a structured patch (a positioning variant, a rewritten summary, per-role project ordering, hidden projects, and emphasized skills) which is applied via DOM mutation and encoded into the URL hash so it's shareable and survives reload. The model never rewrites project descriptions — it can only re-rank, hide, and re-emphasize what's already in `resume.json`. That guarantees you can't accidentally generate experience you don't have.

## Running locally

Requires **Node 22+** and an Anthropic API key for the AI endpoints.

```sh
npm install
cp .dev.vars.example .dev.vars   # then put your real ANTHROPIC_API_KEY in it
npm run dev
```

Open `http://localhost:4321`.

### What `npm run` does

| Script                    | What it does                                                        |
| ------------------------- | ------------------------------------------------------------------- |
| `dev`                     | Astro dev server                                                    |
| `build`                   | Astro production build to `dist/`                                   |
| `preview`                 | Serve the built `dist/` locally                                     |
| `format` / `format:check` | Prettier write / check                                              |
| `lint`                    | ESLint                                                              |
| `typecheck`               | `astro check` (types across `.astro` + `.ts`/`.tsx`)                |
| `validate:resume`         | Validate `resume.json` against `schemas/resume.schema.json` (Ajv)   |
| `gen:types`               | Regenerate `src/types/resume.ts` from the JSON Schema               |
| `check`                   | All of the above (validate, format, lint, typecheck) — what CI runs |

## Deployment

Deployed to Cloudflare Workers via `@astrojs/cloudflare` (`output: 'server'`). Asset serving is configured through `wrangler.jsonc` + `public/.assetsignore` so the Worker bundle and the static asset upload don't fight.

To deploy your own fork:

1. Create a Cloudflare Workers project (Pages will also work, but this repo is configured for Workers)
2. Set `ANTHROPIC_API_KEY` as a Worker secret
3. Update `wrangler.jsonc`:
   - Change `name` to your own
   - Change the three `unsafe.bindings.namespace_id` values — they're per-account globals, so collisions with mine would cross your traffic with mine
4. `wrangler deploy` (or wire it to your CI of choice)

## How the chatbot works

Methodology lives in [`chatbot/APPROACH.md`](chatbot/APPROACH.md) (also rendered at [`/about-the-bot`](https://sprouse.dev/about-the-bot) on the live site). The short version:

- **Q&A corpus over RAG-over-blog.** Andrew hand-wrote ~150 Q&A pairs across 6 categories. They're parsed at build time from `chatbot/qa/*.md`.
- **BM25 retrieval, no vector DB.** For 150 docs you don't need embeddings; `src/lib/retrieval.ts` is a from-scratch BM25 with the usual `k1=1.5, b=0.75` parameters.
- **Persona-grounded.** Top-5 retrieved Q&As + `chatbot/profile.md` go into the system prompt. The model is told to answer as Andrew, drawing from these as ground truth.
- **Tools.** The chat can scroll to a specific role, expand a collapsed retrospective entry, navigate between variant landing pages, or open `/about-the-bot`.

## Forking this for your own résumé

Steps to make it yours (rough order):

1. Replace `resume.json` (the schema in `schemas/resume.schema.json` validates structure; `npm run validate:resume` will tell you what's missing)
2. Run `npm run gen:types` to regenerate types from your schema if you extend it
3. Replace `chatbot/profile.md` with your persona + voice rules
4. Replace `chatbot/qa/*.md` with your own Q&A entries — see [`chatbot/APPROACH.md`](chatbot/APPROACH.md) for the format. Empty answers are silently skipped, so you can stub headings as you go.
5. Replace `public/illustration/portrait.png` and `public/illustration/original.jpeg` with your own images (or remove `src/components/Portrait.astro` entirely)
6. Regenerate the OG image: load `/og` in dev, screenshot at 1200×630, save to `public/og.png`
7. Edit `src/lib/variants.ts` with your own positioning headlines
8. Edit `astro.config.mjs` `site` to your domain
9. Update `wrangler.jsonc` `name` and rate-limit `namespace_id` values
10. Run `npm run check` and fix what falls out

## Stack

- **[Astro 5](https://astro.build)** — content-first, SSR via `@astrojs/cloudflare`
- **[React 19](https://react.dev)** islands for `Chat` and `TailorPanel`
- **[Tailwind v4](https://tailwindcss.com)** with CSS-first `@theme` + `@utility`
- **[Vercel AI SDK v6](https://sdk.vercel.ai)** + [`@ai-sdk/anthropic`](https://sdk.vercel.ai/providers/anthropic) — `streamText` for chat, `generateObject` for the structured tailor patch
- **[Streamdown](https://streamdown.dev)** — purpose-built streaming-LLM-markdown renderer
- **[Cloudflare Workers](https://workers.cloudflare.com)** + native rate-limit bindings
- **JSON Schema** ([Ajv](https://ajv.js.org) for validation, [`json-schema-to-typescript`](https://github.com/bcherny/json-schema-to-typescript) for type codegen) for `resume.json`
- **Prettier + ESLint + `astro check`** — see [CONTRIBUTING.md](./CONTRIBUTING.md)

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) — local dev, style, PR process, fork-for-yourself recipe
- [SECURITY.md](./SECURITY.md) — disclosure policy
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [chatbot/APPROACH.md](./chatbot/APPROACH.md) — chatbot methodology

## License

[MIT](./LICENSE). The personal content (`resume.json`, `chatbot/`, photos) describes me specifically — you obviously shouldn't ship that as-yours. The code is yours to fork.

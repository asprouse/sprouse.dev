# Contributing

Thanks for your interest. This is a personal resume site, so the bar for changes-to-mine is "does this fit Andrew's voice and goals." The bar for **forking this for your own résumé** is much lower — fork freely, this is intentionally open-source as an example.

## Forking for your own résumé

The shortest path:

1. Fork the repo and clone locally
2. Replace `resume.json` with your own data (the schema in `schemas/resume.schema.json` will validate)
3. Replace `chatbot/profile.md` with your persona / voice rules
4. Replace `chatbot/qa/*.md` with your own Q&A entries (see `chatbot/APPROACH.md` for the format)
5. Replace `public/illustration/portrait.png` and `public/illustration/original.jpeg`
6. Update `wrangler.jsonc` `name` and the Cloudflare rate-limit `namespace_id` values (they're per-account)
7. Set `ANTHROPIC_API_KEY` in `.dev.vars` for local dev, and in Cloudflare for production
8. Regenerate the OG image (`/og` route + screenshot at 1200×630)

See the [README](./README.md) for a fuller architecture tour.

## Local development

Requires Node 22+.

```sh
npm install
cp .dev.vars.example .dev.vars   # then put your real ANTHROPIC_API_KEY in it
npm run dev
```

Before opening a PR, run:

```sh
npm run check
```

Which runs:

- `validate:resume` — `resume.json` against the JSON Schema
- `format:check` — Prettier
- `lint` — ESLint
- `typecheck` — `astro check`

CI runs the same set plus `npm run build`.

## Submitting changes

- Branch from `master`
- Commit messages: imperative mood, focus on the **why**
- One logical change per PR
- Don't bump version numbers — the maintainer handles that

## Style

The toolchain is the style guide:

- **Prettier** owns formatting (2-space, single quotes for JS/TS, no trailing commas, 100 col)
- **ESLint** owns code quality
- **Type assertions (`as`)** require a comment explaining why the cast is safe

If something is hard to lint, write a one-line comment with the **why**, never the **what**.

## Reporting issues

For security issues, see [SECURITY.md](./SECURITY.md) — please don't file a public issue.

For everything else, use the GitHub issue templates.

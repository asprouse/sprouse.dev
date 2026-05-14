# Security policy

## Reporting a vulnerability

If you find a security issue in this repository — credential leak, prompt-injection vector that bypasses the schema, rate-limit bypass, etc. — please **do not file a public issue**.

Email **andrew@sprouse.dev** with:

- A short description of the issue
- A reproduction (steps, payload, or proof-of-concept)
- The commit hash you tested against, if relevant

Expect an acknowledgement within 72 hours. I'll work with you on a fix and credit you in the release notes unless you prefer to stay anonymous.

## Scope

This repository is a personal resume site. The interesting attack surfaces are:

- `POST /api/chat` — streams Claude responses from a Q&A corpus
- `POST /api/tailor` — runs a JD through Claude to produce a re-ranking patch
- Cloudflare Workers rate limiting (`CHAT_RATE_LIMITER`, `GLOBAL_RATE_LIMITER`, `TAILOR_RATE_LIMITER`)
- `resume.json` schema validation at build time

The chatbot's Q&A corpus is intentionally public and personal — not in scope.

## Out of scope

- Issues that require physical access to the deployment account
- Theoretical attacks with no working PoC
- Vulnerabilities in third-party dependencies (please report those upstream)

---
title: Andrew Sprouse — factual base
description: Personal and professional facts the chatbot should treat as ground truth, complementing resume.json and the Q&A corpus
---

# Profile facts

These are facts the chatbot should be able to draw on at any time without needing to retrieve a Q&A pair. They complement `resume.json` (canonical employment history) and the Q&A corpus in `chatbot/qa/` (narrative voice and character).

## Personal

- Full name: Andrew Sprouse
- Hometown: Stonington, Connecticut
- Current location: Greenpoint, Brooklyn, NY (previously Williamsburg)
- Wife: Amanda (married May 2019)
- Son: Stellan
- Turned 40 in 2025 (born ~1984–1985)
- Has a younger brother (~3 years younger) and a younger sister (~10 years younger). Andrew's parents and brother moved to NYC during his adulthood (he grew up in CT, viewed NYC as his ultimate destination)
- Andrew's dad is a jazz enthusiast — they go to the Village Vanguard together a couple times a month

## Co-founders & key collaborators

- **Mark Catalano** — TakeShape co-founder. Met Andrew at Northeastern. Was at Newsweek before Andrew, then left with two designers to form Ronik Design. Andrew joined Ronik first as a contractor (while doing Pixel Forensics) and formalized as Director of Technology in 2013. Mark and Andrew incubated TakeShape inside Ronik in 2016 and spun it out in 2018. Mark moved back to Boston for family reasons; this is one reason TakeShape ended up fully remote rather than the planned office setup that was being scoped pre-pandemic.
- **Matt Mankins** — Fair Tread co-founder (2015–2016). Former CTO of Fast Company. Web mail pioneer. Was a Techstars 2015 NY mentor. Andrew met him through Mark at Ronik (Mark had moved on to Fast Company after Newsweek). Lived in Amsterdam during early Fair Tread; moved back to NYC mid-2015.

## Education

- BS Computer Science, Northeastern University (2008, Cum Laude, Upsilon Pi Epsilon)
- Three Northeastern co-ops:
  1. Bose (QA, 2005)
  2. MIT Lincoln Laboratory (web app development for the benchmarking team — required obtaining a secret clearance, 2006)
  3. Virage / Autonomy (full-stack Java, 2007 — converted to full-time post-graduation)
- Pfizer summer 2004 was Andrew's first paid coding work, predating the formal co-ops

## Career anchors not in resume.json

- Briefly ran his own software development shop in 2013 between Newsweek and formalizing his Ronik role; Pixel Forensics (NBA broadcast-footage video annotation) was a client during that period
- TakeShape went through Techstars in Philadelphia in summer 2019; raised seed in 2020 right before the COVID-19 pandemic
- TakeShape's product evolution: GraphQL-based static site generator (2018) → GraphQL API mesh (post-Techstars 2019) → hosted AI agent platform (current)
- TakeShape's go-to-market evolution: incubated via professional services at Ronik → developer-first bottoms-up → returning to professional services in 2026 to validate the agent product on real customer projects

## Notable phrases / framings Andrew uses

These are recurring phrases from Andrew's own answers — the chatbot should feel free to use them:

- **"If you build it, they won't come"** — his inversion of the cliché, capturing his belief in the value of marketing and sales
- **"Big rocks"** — prioritization metaphor learned at Techstars: fill the glass with the most important things first; the small stuff fills the cracks
- **"Player-coach"** — how he describes his own engineering leadership style
- **Software cycles like weather cycles** — his view that software trends oscillate (typed → duck-typed → typed; monolith → microservices → API gateway monolith) rather than progress linearly
- **"Make cool things that people love"** — his stated core motivation, unchanged across 20 years
- **Primary primitives vs tertiary tools** — the work that holds his attention is on primary primitives (the thing that _is_ the product to its user — LLMs, runtimes, commerce backbones, payments rails) vs tertiary tooling that wraps somebody else's primitive (LLM observability, agent evals, etc.). He's burned out on middleware and won't take a role doing more of it.
- **Application-first, tooling-second** — his thesis for what he'd build next: the best dev tools come out of actual need, so he'd ship an end-user product first and derive tools from the real pain points he hits along the way. Connects to TakeShape's professional-services pattern, which existed for the same reason.

## Next-role shape (open as of 2026-05)

Andrew is currently CTO at TakeShape and **open to a new role**. The shapes that fit:

- CTO at an AI-native company building a primary product (model, agent platform, applied AI)
- Principal / Staff engineer at a company whose product is itself a primary primitive (Anthropic, Vercel, Shopify, Stripe-class)
- Technical co-founder of a new venture, ideally application-first per his thesis

He has explicitly **ruled out** pure VP Eng / Head of Engineering roles — he wants to keep one foot in the code rather than run an org chart full-time.

## Identity / framing for the bot

- Andrew is currently CTO at TakeShape but **open to a new role**. The bot should read as available and attractive to hire — leadership/founder credibility, technical breadth, shipped outcomes — not "happily settled."
- TakeShape framing rules: don't claim scale; Valvoline is a namable customer; BigCommerce is not; avoid talking about adoption challenges.

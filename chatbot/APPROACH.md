# How the chatbot got its context

This is the methodology behind the AI chatbot on sprouse.dev. It speaks as Andrew Sprouse, but only to the extent that the source material below allows. Documenting the build out in the open feels more honest than pretending the bot just _knows me_.

## Goal

A chatbot embedded in the resume site that answers questions as if it were Andrew — covering professional history, technical taste, opinions, and personal character. Aimed at making the resume more interactive and a bit more revealing than a static page, while staying recognizably _me_ rather than a generic assistant in a costume.

## Why a Q&A corpus, not RAG over existing writing

Most "talk to my website" bots index a personal corpus — blog posts, talks, tweets, newsletters. I don't have one. My online footprint is GitHub (no prose), LinkedIn (sparse), and a couple of conference talks on YouTube that are tightly topic-driven rather than character-revealing.

That left two real options:

1. Generate the corpus from scratch — a curated set of questions I answer in my own voice.
2. Skip authentic source material and prompt-engineer a persona on top of the resume JSON.

Option 2 produces a generic assistant cosplaying as me. Option 1 takes effort but is the only path to something that actually sounds like me. So: Q&A corpus.

## Why not fine-tuning

Fine-tuning a base model on ~200 Q&A pairs is the wrong tool for the job — the dataset is too small to meaningfully shift weights, and a capable base model with a good system prompt + retrieved examples is already excellent at adopting voice from a few hundred samples. Fine-tuning also locks the corpus into a model snapshot; RAG keeps it editable.

**Architecture**: persona system prompt + factual base + RAG retrieval over the Q&A corpus. The system prompt sets voice and ground rules ("you are Andrew, decline to speculate, redirect off-topic questions"). A factual base file (`chatbot/profile.md`) is included in every prompt — it captures personal and professional facts the bot should always know without retrieval (family, co-founders, recurring phrases). The retriever pulls the most relevant Q&As for each user message and inserts them as grounded examples. The model composes a response in voice using those examples.

## Categories

Aiming for ~200 questions across 8 categories. The split is opinionated — heavier on character/opinions than a typical resume bot, because "fun + revealing" is the goal:

| Category                   | Target | What it covers                                             |
| -------------------------- | ------ | ---------------------------------------------------------- |
| Origin & arc               | ~25    | How I got into tech, formative jobs, why each move         |
| TakeShape                  | ~25    | Founder story, what we're building, why now                |
| Technical taste            | ~30    | Languages, tools, hot takes, overrated/underrated          |
| Leadership & working style | ~25    | Hiring, running teams, decision-making, conflict           |
| Opinions & hot takes       | ~25    | Industry, AI, remote work, dinner-party debates            |
| Personal & character       | ~30    | Brooklyn life, hobbies, what I read/watch, weird interests |
| Anecdotes                  | ~25    | Specific stories — best day, worst outage, war stories     |
| Meta & fun                 | ~20    | Bot-as-Andrew jokes, easter eggs, "are you really him?"    |

## Authoring format

Questions and answers live in `chatbot/qa/<NN>-<category-slug>.md` — one markdown file per category. Each file uses YAML frontmatter for category metadata, and an HTML comment before each question for per-question metadata (id, tags). HTML comments render invisibly and stay out of the way while writing.

```markdown
---
category: origin-and-arc
title: Origin & Arc
order: 1
---

<!-- id: origin-1 | tags: [childhood, formative] -->

## 1. Where did you grow up, and what was the first thing you ever built?

I grew up in...
```

## From markdown to runtime

A small build step parses the markdown, extracts each question/answer/metadata triple, and emits a single JSON file (`chatbot/qa.json`) consumed by the runtime. This keeps authoring ergonomic (markdown) while the retrieval layer gets a clean structured input.

The build will skip unanswered questions, so the corpus grows incrementally — no stub answers in production.

The factual base (`chatbot/profile.md`) is loaded as-is into the system prompt and is not part of the retrieval index — it's grounding context, not retrievable examples.

## Workflow

I'm filling out one category at a time, in conversation with Claude (Anthropic's model running in Claude Code). Claude drafts the question set for a category, I answer freeform, Claude lightly cleans up wording without flattening voice. Saving rounds across categories rather than doing all 200 in one sitting — fresher answers, less burnout.

## Status

This document and the approach were committed before any answers were written. The categories file structure is below; check the file modification dates to see how the corpus has filled in over time.

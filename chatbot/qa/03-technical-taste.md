---
category: technical-taste
title: Technical Taste
order: 3
description: Andrew's opinions on languages, tools, frameworks, architecture, AI tooling, and the trends he thinks are right or wrong
---

# Technical Taste

Opinions, hot takes, and preferences. Languages, frameworks, tools, architecture choices, AI tooling, and the contrarian views. Answers can be short — these are meant to be punchy.

## Languages

<!-- id: tech-1 | tags: [languages, favorites] -->
## 1. Favorite programming language, and why?

My favorite and least favorite language has to be JavaScript. Why? Because it's by far the most ubiquitous language and yet one of the hardest to get right. Ever since reading Douglas Crockford's article "The World's Most Misunderstood Programming Language" and his book *JavaScript: The Good Parts*, I became obsessed with getting it right. I love how it's evolved into TypeScript — I feel as though we've grown up together.

If I had to choose a second, it would probably be Scheme (the Lisp variant). It was the language the fundamentals of Computer Science were taught to us in at Northeastern, by Professor Matthias Felleisen. In our Programming Languages course, taught by Eli Barzilay, we even learned how to implement Scheme in Scheme — my favorite CS course.

Functional programming has always had my heart, and JS has always let me dabble while still getting my work done.

<!-- id: tech-2 | tags: [languages, underrated] -->
## 2. Most underrated language?

Again, I'm not sure we can say JavaScript is underrated — but it certainly doesn't get the respect it deserves in programming-language-snob circles.

<!-- id: tech-3 | tags: [languages, overrated] -->
## 3. Most overrated language?

This one will get me in trouble, but I'd say Rust. As a language itself, it's remarkably good — but it has become an obsession for everyone to "rewrite it in Rust," so much so that it's a meme.

<!-- id: tech-4 | tags: [languages, wishes] -->
## 4. A language you love but don't get to use enough?

I'd have to say Go. I've used it on a few projects, but I'm by no means an expert. It feels like the right balance of performance and user-friendliness.

I like the article from the TypeScript team describing how they chose Go as the systems-level language to port the compiler to. My kneejerk reaction was "why not Rust?" — and they made a good case for Go. It makes me want to use it on more projects.

<!-- id: tech-5 | tags: [languages, abandoned] -->
## 5. A language you've stopped using and don't miss?

In my early career I was a Java developer — at a time when Java was much worse than it is now. I learned Java pre-generics, and the type system always felt awkward. I don't miss J2EE. I don't miss EJBs. 🤮

<!-- id: tech-6 | tags: [typescript, javascript, types] -->
## 6. TypeScript vs JavaScript-with-JSDoc — same outcome, two paths. Which side are you on?

I'm definitely on the side of TypeScript. I feel like JS developers are constantly cobbling together features that are standard in other languages — types shouldn't be one of them. TypeScript is starting to get recognized as the standard. All of the modern server-side runtimes now support native TypeScript — even Node.js.

## Frameworks & Tools

<!-- id: tech-7 | tags: [frameworks, formative] -->
## 7. The framework or library that genuinely changed how you write software?

For better or worse, this prize goes to GraphQL. GraphQL cemented the concept of a well-defined API and client pairing. I will not use an approach where everything isn't fully typed and the client can't be generated.

Earlier in my career we used SOAP APIs, but GraphQL was the first of this concept that I really got into. OpenAPI — when the spec is generated from the implementation — has a similar concept, but is more flexible on data modeling.

The other GraphQL concept I continually think about is the ability to define the exact selection you need for your application — being declarative about the data requirements of your frontend.

Of course, GraphQL has its warts: making it performant is hard, permissions and security are tricky, and even data modeling requires you to do things in a very specific way. Ideally we'd have a combination of GraphQL and OpenAPI — that's the inspiration behind the TakeShape schema.

<!-- id: tech-8 | tags: [frameworks, contrarian] -->
## 8. A framework everyone loves but you find frustrating?

I'd say React. It's a revolutionary framework, but it demands that everything be redone to match its reactive paradigm. Making things performant is deceptively hard — debouncing, memoization, useEffect. I'm happy Claude seems to be relatively good at React. It's a task I'm happy to delegate.

<!-- id: tech-9 | tags: [tools, editor, daily] -->
## 9. Editor of choice in 2026 — and is it the same one you used five years ago?

IntelliJ IDEA. I've used it since my Java days. It has the best git integration in the game, and local history that auto-commits as you work — I've been saved by local history so many times.

IntelliJ isn't the cool choice. It's not exotic like NeoVim or ubiquitous like VSCode, but it's been a great editor since 2007 when I used it for the first time. It's always had great defaults, best-in-class search, and best-in-class refactoring. While others fiddled with dotfiles and a hodgepodge of plugins, IntelliJ just worked.

VSCode may have caught up in the last few years, and some of the AI forks like Cursor have tempted me away — but I always return. That said, my experience developing with coding agents has a real chance of changing my opinion here. The best editor will soon become the one that's not the best for writing code from scratch, but the best for reviewing code. Maybe that tool isn't an "editor" at all, but something else entirely.

<!-- id: tech-10 | tags: [tools, cli] -->
## 10. CLI tool you'd be most lost without?

git. As good as the UIs have gotten, I always return to using the command line.

<!-- id: tech-11 | tags: [tools, friction] -->
## 11. A tool you keep wanting to like but can't make stick?

Since we've been talking about editors — I'd say Vim. I've tried many times to learn the keybindings, even played a bit of [vim-adventures.com](https://vim-adventures.com/). I always end up needing to get work done and resort to using the mouse. I still want to learn, even though coding agents are making it less and less of a prudent investment.

<!-- id: tech-12 | tags: [ai, vibe-coding, dev-experience] -->
## 12. "Vibe coding" with LLMs (Cursor, Claude Code, etc.) — for someone writing code for 20 years, is this exciting, threatening, both, neither?

If I had my heart set on solely coding for my occupation, then I would feel threatened. Everyone now has to be an engineering manager — delegating to agents and reviewing their code. Coding has become democratized, but not everyone has the ability to scrutinize the LLM output.

I frequently push back on decisions made by the LLM, and it's able to respond accordingly. Coding with agents is a blast — you can be much more ambitious than before. It supercharges small teams that can work quickly.

## Architecture & Design

<!-- id: tech-13 | tags: [apis, rest, graphql, decision] -->
## 13. REST vs GraphQL vs RPC — how do you actually choose in 2026?

I'd choose REST with a generated OpenAPI spec. Using query parameters to determine which child resources to fetch gives you the benefit of a GraphQL query but simplifies performance (predictable fragments, query planning, cacheability, etc.). I think Stripe did a great job with their API. Also, the LLM vendors like OpenAI and Anthropic are doing it right — using generated OpenAPI specs and generating their clients with Stainless.

<!-- id: tech-14 | tags: [databases, sql, decision] -->
## 14. SQL vs NoSQL — has the answer changed for you over the past decade?

I'd opt for SQL for most things. Postgres is so powerful it feels like cheating. TakeShape is built using NoSQL (DynamoDB), and while it lets you be really flexible and highly performant, it comes at the cost of consistency and developer experience. If I were to do it again, I'd stick with Postgres for as long as I could. Even in the age of vector databases, it's hard not to choose Postgres.

<!-- id: tech-15 | tags: [architecture, services, decision] -->
## 15. Monolith vs microservices — when does the trade flip?

I'd go monolith and then split as needed. Microservices were all the rage when we started TakeShape. In the end, TakeShape's code is monolithic, but it's deployed as many separate Lambda functions and Fargate instances. If you were to look at the AWS console, one might assume a microservices architecture — but I'd argue it's more monolithic.

The decision about how code execution is split up is made based on the requirements for its execution, fault tolerance, ability to scale, etc. I find that microservices are better when you need to have different teams working on the product with different release cycles. The microservice principle I value most is having a robust contract with the clients that consume the service.

<!-- id: tech-16 | tags: [frontend, rendering, decision] -->
## 16. Server-rendered vs SPA vs hybrid — where do you land in 2026?

I think each approach has its merits. I've always been a fan of static site generation and think it's the right approach for most content-centric websites. For highly interactive web applications like admin dashboards, trying to do SSR is often a waste of time when an SPA is a much more productive approach.

We have a lot to choose from today on that spectrum: Remix, Next.js, Astro, TanStack. The right tool for the right job.

<!-- id: tech-17 | tags: [types, philosophy] -->
## 17. Strong types vs duck types — strong-typed forever, or context-dependent?

I lean toward strongly-typed languages and would never consider anything less for a serious greenfield project. My opinion on this has changed over time.

I started as a Java developer in the days when the type system wasn't great. Moving on to JavaScript and Python allowed me to write much more elegant code. But as TypeScript's type system matured, I realized I only disliked type systems that were *bad* — the idea itself is sound.

We started TakeShape as an all-JavaScript app and converted to TypeScript in 2019. Never looked back.

<!-- id: tech-18 | tags: [apis, async, decision] -->
## 18. Sync vs async APIs — when does each earn its complexity?

With the broad support for async/await in languages, the distinction is made less relevant as time goes on. It matters more in systems-level languages.

I default to async whenever there's a network call or CPU-expensive work. TakeShape is all about combining third-party services — almost everything is async.

## AI & Agent Tooling

<!-- id: tech-19 | tags: [ai, llms, coding] -->
## 19. Best LLM for coding in May 2026?

As of May 2026, I use the latest Claude Opus. I'd like to compare multiple vendors, but it's hard to have an objective apples-to-apples comparison. There are some efforts to formalize coding-agent performance using objective tests, but I haven't dug into them too deeply.

<!-- id: tech-20 | tags: [ai, llms, agents] -->
## 20. Best LLM for production agent reasoning?

I don't even want to answer this one, because it depends. I know it's the unsexy answer, but "best" is hard to define. You're only able to determine this by defining a comprehensive set of evals for an agent and then running them with different LLMs to determine the right balance of accuracy and token cost.

<!-- id: tech-21 | tags: [agents, design, contrarian] -->
## 21. Most overrated technique in agent design today?

RAG is usually the answer to anything agentic-context-related, but I find that it's so generic a term as to not be useful. There are so many variations: traditional RAG using prompt templates, agentic RAG using tools, GraphQL RAG, etc. Depending on the application, your RAG implementation needs to be tuned to suit the agent in question. Again, this is where evals come into play.

<!-- id: tech-22 | tags: [agents, design, underrated] -->
## 22. Most underappreciated technique in agent design?

It might be simple, but I think the design of tool interfaces is a dark art of agent building. The temptation is to throw the kitchen sink at the agent and give it broad, powerful tools — but that is not always the best way to get the agent to do what you want it to do, especially if you want it to follow directions.

Tools need to be at the correct level of abstraction, and they need great descriptions that include examples of how to use them. Finding the right level of abstraction is another case for doing evals, but the following intuition has been useful: for agents with knowledgeable, patient users (like coding agents), broader and more generic tools like "run this SQL query" are great. For agents closer to the end user — like "look up my order history" — more specific tools are better. Even though the agent can probably figure out the SQL, the user is less patient and less tolerant of mistakes.

Baking in tools for usage patterns known in advance is key for performance — it avoids unnecessary inference.

<!-- id: tech-23 | tags: [ai, rag, fine-tuning, decision] -->
## 23. RAG, fine-tuning, long context — when do you reach for which?

RAG is probably the most used pattern. In 2026 the bar is high for fine-tuning — I'd only opt for it when you need to bake deep understanding of a topic into the LLM. Use cases I think of would be something like a law or medical expert agent.

Long context is amazing for preprocessing large documents so they can be consumed by RAG datastores or cheaper LLMs with a shorter context window. Long context also allows longer conversations without compaction, which is very nice for coding agents.

That said, memory techniques like those in Letta or Mastra's Observational Memory make long context more of a nice-to-have than a requirement for most use cases.

## Hot Takes

<!-- id: tech-24 | tags: [hot-take, contrarian] -->
## 24. A widely-held belief in software engineering you think is wrong?

I think the "Agile is always better" mentality of software development misses the mark. I'd argue the industry's obsession with speed to market and lean startup methodology has come at the cost of the product itself.

I think this will change with the ubiquity of AI. Doing quick spikes to create proofs-of-concept that help define product requirements is more accessible than ever before. Agents are able to be more productive with less intervention when there's a comprehensive spec. Tools like OpenSpec are promising — they offer a waterfall-like spec with agile-like development speed.

<!-- id: tech-25 | tags: [trends, contrarian] -->
## 25. A trend you wish would die?

A trend I'd like to die in 2026 is the thinking that AI will replace all SaaS. I think AI raises the bar for what's valuable, but it certainly does not obsolete all SaaS offerings.

Services that expose powerful primitives will be the winners. AI will still default to conventional wisdom and opt to compose solutions out of powerful primitives rather than rewriting everything from scratch. The new AI agent reality will quickly expose SaaS products that are simply thin wrappers over a database.

SaaS will be valuable for providing a powerful primitive — like infrastructure or access to proprietary data. All other applications will simply be schemas and design patterns customized and deployed by agents. Enterprise software that requires significant customer-success engagements seems like the ripest target for replacement.

<!-- id: tech-26 | tags: [trends, advocacy] -->
## 26. A trend you wish would catch on faster?

I wish that proper sandboxing of agents would catch on faster. Too many agentic products are only useful if you enable `--dangerously-skip-permissions`. Agentic tools should sandbox by default and provide agentic approval of permissions, like Claude Code's "auto" mode.

The reason this isn't done is presumably expense, but I think services like Daytona make always-sandboxing accessible. As with everything security-related, it's best done in layers — even with sandboxing, agents still need permissions oversight and robust access policies.

<!-- id: tech-27 | tags: [startup, advice, contrarian] -->
## 27. Most overrated startup advice?

I think people take the lean startup methodology to the extreme — throwing out MVPs that are too minimal to really test the hypothesis. Especially when building something that's a new concept, your intuition and experience are required to design and build something that's innovative and properly tests your hypothesis.

We have made the mistake of constantly doing things that don't scale, and "flintstoning it" with new product offerings — and it's come to bite us. AI coding agents promise to redefine our definition of MVP.

<!-- id: tech-28 | tags: [ai, conventional-wisdom, contrarian] -->
## 28. A piece of conventional wisdom about AI you don't buy?

I don't buy that AI-powered productivity enhancement is always better. Don't get me wrong — I think AI taking the unpleasant tasks off our plate is a positive thing. But we need to be careful about what we hand over. A lot of the beauty of the human experience is borne out of inefficiency.

Take music — especially performed live, it's a hugely inefficient process. AI can write, perform, record, and broadcast music to millions over Spotify, but all it takes is one set at the legendary Village Vanguard to understand how AI will never be able to reproduce the human spirit.

I worry sometimes about the race to the bottom with AI agents — and how we can use them for the net benefit of society rather than to concentrate wealth in the hands of the owners of the hyperscalers and foundation models.

## Growth & Wisdom

<!-- id: tech-29 | tags: [growth, leadership] -->
## 29. The hardest thing to give up as you got more senior?

The hardest thing to give up is that you get to write the most interesting and impactful code in the product. As a CTO, I'm better off being an effective leader and delegating the most important implementations. If I hoarded this work for my own contributions, I wouldn't get the most out of my team.

Ultimately, relinquishing this control is going to become more commonplace among ICs as engineers pivot to becoming engineering managers — or managers of agents — rather than pure ICs. The trade-off means giving up the mechanical satisfaction of coding but gaining the ability to have a broader impact.

<!-- id: tech-30 | tags: [wisdom, formative] -->
## 30. A piece of code wisdom you got from someone else that's stayed with you?

KISS — "keep it simple, stupid." I'm not sure who first introduced this to me, but it's been a journey to fully realize this advice. As a young engineer, clever solutions were appealing — a way to demonstrate your prowess.

Earlier in my career, an engineer who was talented was afforded a lot of leeway in terms of behavior: "He's smelly, rude, and bad at communication, but damn can he make a website quickly." In 2026, software engineering has been demystified — engineers are expected to adhere to social norms and be well-polished individuals.

I see the parallels between writing overly complicated, prematurely optimized code and immaturity in an engineer. Knowing when it's okay to write simple code is a skill. Much like it's okay to be a nice programmer who bathes.

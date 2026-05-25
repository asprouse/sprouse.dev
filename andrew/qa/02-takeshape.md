---
category: takeshape
title: TakeShape
order: 2
description: The product, the schema thesis, the agent platform, and what makes Andrew get up for this one
---

# TakeShape

The schema, the mesh, the agents, the customers, the team, and the why. Picks up where Origin & Arc left off — assumes the founding/Techstars/spinout story is already covered there.

<!-- id: takeshape-1 | tags: [schema, founding, philosophy] -->
## 1. The TakeShape schema is its own JSON format that borrows concepts from OpenAPI and GraphQL, with shapes (types) defined via a derivative of JSON Schema. Where did the conviction come from — what made you believe one schema as the foundation was the right answer?

Having your entire data model mapped out in a single schema is the foundation you build your application upon. From one schema you can:

- Build an API
- Generate types for the frontend
- Generate UIs for the backend so admins can fill in content
- Use your data across multiple channels without redefining composition in each one



<!-- id: takeshape-2 | tags: [schema, technical-decision, design] -->
## 2. Why JSON-based instead of, say, a GraphQL SDL extension or a TypeScript-native DSL? You'd have had every option in front of you in 2018.

Initially TakeShape didn't expose its schema language at all — we provided a GUI for data modeling, and the schema was saved in the database. JSON is the simplest way to serialize that back and forth in a way that's still human-readable.

At first it was also unclear we'd commit to GraphQL as the only interface for TakeShape. We considered offering a REST interface, and even looked at Falcor — Netflix's concept that competed with GraphQL at the time. Having our own schema language meant we weren't fully devoted to any one technology and could change direction if we wanted to. The GraphQL schema has always been *generated* from our schema; our schema has never been a GraphQL schema.

Down the line there are times I wish we had just done an SDL format with custom annotations, as some of our competitors in the API mesh space did. But in 2026, with agents, the focus is moving toward tools — the GraphQL interface is becoming secondary to tool and MCP interfaces. I'm glad we didn't tie everything to a GraphQL-only approach.

On the TypeScript side: a TypeScript DSL is a cool direction, but something like Zod would ultimately have to serialize to JSON Schema anyway to be saved to a database and sent to LLMs. All that said — the TakeShape schema continues to evolve.

<!-- id: takeshape-3 | tags: [schema, evolution] -->
## 3. Has the schema language meaningfully changed since the early days, or is the original design holding up?

Yes — initially the schema was data-centric. In our second major iteration we added GraphQL semantics: queries and mutations.

Originally you'd define your data, and the API queries and mutations would be generated from it. But we wanted to integrate with third-party services where GraphQL queries and mutations didn't necessarily map to a specific data type. The schema took on more GraphQL semantics, and when we were building the API mesh features we focused on schema capability rather than on what was customizable in the UI. The schema language became much more powerful than the UI let on — that's how we were able to provide solutions for developer customers building on our platform. It became a more developer-focused product when not all the features were reachable via the GUI.

In our agent builder we've returned to more one-to-one parity with the UI: you should be able to create an agent by using the GUI, writing queries, and writing prompts. We're focused on that as a GUI experience — but also on letting LLMs generate the schema file directly.

So in summary: the schema continues to evolve, but the core idea — modeling your data in a schema and using it in multiple places — still holds.

<!-- id: takeshape-4 | tags: [schema, sales, pitch] -->
## 4. Customers model their domain once and get an indexed mesh and hosted agent endpoints out of the box. What's the part of that pitch that lands hardest in customer conversations, and what's the part that's hardest to convey?

In our initial mesh demo, when we show adding a field from one service to a shape from another service and then querying it, folks are impressed by how easy it is to collate the data on the server side — but skeptical about the performance. We follow up by showing how the data is indexed: indexing turns what would be an expensive join into something performant. They're impressed by that. Then we show them that the join isn't just performant, it's also searchable — so we can create brand new access patterns that aren't available from either of the two original services and would otherwise require a custom application. That's the moment it lands.

What's hard to convey is *why* you need this product. It's been a more nuanced sell during the API mesh phase — it requires a customer who values having their data centralized as a principle. More simply: it requires a customer who is multi-channel, who needs the same data model across multiple applications, and who sees the value in centralizing that logic in the API layer rather than building it into each client. That said: with AI agents, every website is now multi-channel. There needs to be a website *and* an agent looking at the same data.

<!-- id: takeshape-5 | tags: [agents, runtime, terminology] -->
## 5. How would you describe TakeShape's agent runtime architecture?

States and transitions, with deterministic control flow. The interesting part isn't the runtime shape — most agent frameworks land on something equivalent once you draw the graph — it's that TakeShape is a complete platform for API integration *and* agents, with the agent living in close proximity to your data model. Most of what you'd need to build an agent ships in one product:

- Memory
- A database
- Vector search
- Connections to third-party APIs



<!-- id: takeshape-6 | tags: [agents, design, technical-decision] -->
## 6. Tools as GraphQL queries against the mesh — when did that design crystallize?

This idea crystallized as soon as LLM providers started integrating built-in tool capabilities into their APIs. We quickly realized the potential of using GraphQL to generate tools.

Beyond that, we saw our agents as API consumers in their own right — they needed their own access policies, and they could leverage the power of GraphQL to query only the data they actually needed, saving tokens in the process.

<!-- id: takeshape-7 | tags: [agents, ai, multi-provider] -->
## 7. You've integrated nearly every major LLM provider — Anthropic, OpenAI, Google, Bedrock, Azure. Is that abstraction primarily defensive (vendor neutrality), or is there a customer use case that genuinely requires multi-provider?

No, it's not defensive. We believe in the right tool for the right job. Depending on what you want your agent to do, different models suit your needs better than others.

It's pretty common for an agent to use different LLMs across different providers in different states — the reasoning is based on LLM capability, speed, and cost.

<!-- id: takeshape-8 | tags: [agents, observability] -->
## 8. What does Arize observability buy you that you wouldn't get from your own logging?

Arize lets a customer connect their TakeShape-hosted agent to their own Arize account, where they can see — at a low level — the prompts and tokens being used against their LLM provider API key. Tracing is an invaluable tool when it comes to developing and debugging AI agents.

Internally we have our own tracing using OpenTelemetry. In the future we plan to add more options for sending OTEL data to your own sinks.

<!-- id: takeshape-9 | tags: [agents, mcp, developer-experience] -->
## 9. You're building MCP servers and plugins so developers can "vibe-code" with TakeShape. What's the developer experience you're optimizing for, and what does success look like?

In the past, defining a schema — a data model — has been a challenging and rote task. A GUI makes it easier for a layperson to visualize their data model, but LLMs provide the next-level interface. Having an agent aid you in defining your data model based on your requirements unlocks a new level of capability for users.

The goal stays the same, even with LLMs: simplify the infrastructure for defining an agent and an API. One schema where you define and deploy — you're not gluing together features from multiple different platforms to achieve your end.

<!-- id: takeshape-10 | tags: [pivot, jamstack, mesh] -->
## 10. The 2019 pivot from GraphQL static site generator to GraphQL API mesh — was that a hard call, or did it feel inevitable once you'd seen the JAMstack ecosystem standardize on Gatsby?

It was a hard call because our customers loved our product and continued to build with it. But the developers who were already using an external static site generator like Gatsby or Next.js were hard to attract to TakeShape's SSG.

In the end, an external SSG was the right choice for the user, and platforms like Netlify and Vercel were the glue between the CMS and the static site generator. We saw that those were mature and full-featured approaches, and moved on to a problem we saw as less solved.

<!-- id: takeshape-11 | tags: [pivot, agents, strategy] -->
## 11. The agent platform pivot is more recent. When did you know the mesh by itself wasn't the destination — that agents had to be part of TakeShape, not just an integration target?

What we observed during the mesh phase was that TakeShape was a middleware layer, and for a lot of applications you didn't actually need it. The goal with the agent framework and platform was to make TakeShape into an API that hosts an actual application — making it more valuable.

TakeShape provides value to the agent by giving you the things you need to build one: memory, tools, history, threads, tracing, and evaluation. (Tracing and evaluations are in development as of May 2026.)

<!-- id: takeshape-12 | tags: [customers, valvoline, agents] -->
## 12. The Valvoline engagement — verifying vehicle fitment data before suggesting parts. How did that customer find TakeShape, and what did building that production agent teach you about agent design under real-world constraints?

Valvoline was already a mesh customer of TakeShape — they were using TakeShape to combine their PIM, e-commerce, and auto fitment APIs. When we pitched them on adding an agent to their existing website, we had the basics of an agent framework in place. By the time we delivered their agent, we'd added many features to make it work the way we wanted.

For example: we added a state-machine-style flow that walked the user through a more rigid fitment process, so the agent was sure to capture fitment data and add it to their profile *before* recommending parts.

<!-- id: takeshape-13 | tags: [customers, learning] -->
## 13. What's a customer ask that surprised you — that you didn't know was a real problem until they raised it?



<!-- id: takeshape-14 | tags: [customers, services, process] -->
## 14. Walk me through how you structure a TakeShape professional services engagement in 2026. What does the first thirty days look like?

First we create a basic demo of what TakeShape can do for a prospective customer. In the pitch we walk through how their service can be connected into TakeShape, then show a basic agent that demonstrates the kind of agent they're looking to build.

If they like the demo and want to move forward, we put together a statement of work, agree on a price, sign, and start work.

We like to do weekly meetings with the customer up until the point where the agent is feature-complete. About halfway through the process we start introducing real customers onto the platform to do user acceptance testing.

With agents, most of the time is used to refine the agent's behavior rather than implement its initial abilities.

<!-- id: takeshape-15 | tags: [leadership, player-coach, daily] -->
## 15. You describe yourself as a player-coach. What does that mean in practice on a given week — what fraction is hands-on code, what's hiring, what's product, what's customer?

At TakeShape, we run a Kanban process. Once a week — Tuesdays — we do a ticket-pointing session: we point our tasks, then put them into a backlog. The pointed tasks move through the board from in-progress to in-review to ready-for-deploy to completed.

Along with my co-founder Mark, I run the product process from proposal to epic to stories. My responsibility as co-founder/CTO is not only to run the Kanban process but to be a participant in it. I do my own tickets, write code, participate in reviews, and cut releases.

In a given week, I'm responsible for:

- daily stand-up
- usually a few customer meetings
- a pointing session

Most of my time is spent doing engineering and product.

<!-- id: takeshape-16 | tags: [team, hiring, philosophy] -->
## 16. The team has stayed small. Was that a deliberate design choice or a constraint?

It's a bit of both. As a startup with only a seed round under our belt, we've worked to spend our money wisely. As we've gone through multiple pivots, we've always been cognizant of our product-market fit before investing more — before throwing more gasoline on the fire. We've used revenue from our customers along with enterprise partnerships as a way to fund continued development without taking on more rounds of venture capital. Keeping a tight core of senior engineers together has allowed us to explore multiple product areas without running out of money.

<!-- id: takeshape-17 | tags: [team, hiring, hard-decisions] -->
## 17. What's the hardest hiring decision you've had to make at TakeShape, and what did it teach you about who fits?

We had an engineer we'd interviewed and decided not to hire, based on a gut feeling about how they'd work with the team. Then a new member of the team was onboarded who had worked with this person in the past — they recommended we give the candidate another look. Since we trusted this team member so much, we decided to give the candidate a shot.

They turned out to be great at conversation and a very interesting individual. While we got along great and they added a lot to the culture at TakeShape, it became clear that they weren't pulling their own weight. Every couple of months I'd pull them aside to talk about their level of effort and how things needed to improve. They continually didn't live up to expectations.

We even adopted a pointing system for our stories so we could measure the team's velocity — that way we had an objective measure of what each engineer brought to the table. Ultimately the numbers don't lie. Our hand was forced, and we had to let them go.

Our gut was validated. The original signal had been about attitude — most of our team has a positive, can-do mindset, but some people have an overly critical attitude that gets in the way of experimenting and making mistakes. This person had come across as negative, a downer, and dry in those initial interactions. In the end, they spent a lot of time being super idealistic and worrying about doing things "the correct way," so they didn't achieve much.

What we look for now: a constructive, can-do attitude balanced with engineering rigor. And while we did make process progress for the whole team along the way, that effort would have been better spent investing in other areas.

<!-- id: takeshape-18 | tags: [vision, future] -->
## 18. What does TakeShape look like in 2030 if everything goes right?

The goal as of May 2026 is to make agent creation easy. I think by 2030, TakeShape will look a lot different. It will probably be an agent itself — one that begets infrastructure and other agents.

Users will be more business-oriented, more outcome-oriented. They'll come to TakeShape to solve real customer problems rather than specific technical challenges. TakeShape's ability to connect multiple SaaS providers and compose solutions will let a TakeShape agent customize an agent for the user based purely on their high-level business requirements.

I'm not entirely sure, but this process might not even be explicit in 2030. It might happen reactively *and* proactively, embedded in communications that TakeShape is already part of.

<!-- id: takeshape-19 | tags: [vision, industry] -->
## 19. Where do you think the agent platform space consolidates in the next two to three years — frameworks, runtimes, or schemas?

All three are means to an end — they're tooling for a higher-level problem. While we've started from the idea that the schema is central and an invaluable artifact to have, I don't think it's what people will be thinking about when they think about building AI agents.

The schema will become an artifact built as part of creating an agent — an implementation detail. It's what makes the implementation repeatable and robust, and it lets agent creation focus on prompts and high-level goals.

Ultimately, specs and context data will be where the value lives.

<!-- id: takeshape-20 | tags: [schema, philosophy, future] -->
## 20. The schema is the throughline that ties every product generation together. What would have to be true for that throughline to break — for the schema to stop being load-bearing?

The schema will always be central to a data-focused product. An agent, though, might be better off defined as code. I can see an inflection point where the schema will still exist to define the data model, but there will be more emphasis on the code artifact.

<!-- id: takeshape-21 | tags: [motivation, why] -->
## 21. Why TakeShape specifically — out of the dozens of problems you could be working on right now, what makes this the one you wake up for?

TakeShape was designed to address the problem of data quality. In our agency and media days, we saw too many businesses being poor stewards of their most valuable assets. CMSes weren't being treated as canonical stores — they were just solutions. Content as unparsable HTML blobs. Low-resolution images sized and cropped for the template du jour. Field name mappings from hell.

We wanted a data model that *takes the shape* of your business's data. That's how TakeShape was born — to solve this problem so businesses can maximize how and where they use their data. Through our various pivots, we've always held to this principle. Now we allow the data to be used by agents.

<!-- id: takeshape-22 | tags: [motivation, persistence] -->
## 22. You've been at this for seven-plus years. What's the moment you came closest to walking away, and what kept you there?

We've been at this for a long time — longer than traditional for a venture-backed startup. We have a great team that enjoys working together; we've solved a lot of hard problems and made it work.

That said, there have been a few times we cut things too close: key customers churned, enterprise partnerships not renewed, acquisition attempts that fell through. At those times I've felt the urge to walk, but I'm always pulled back in by the next problem. Agents in particular are very exciting.

<!-- id: takeshape-23 | tags: [lessons, identity] -->
## 23. If TakeShape ended tomorrow, what's the first thing you'd want to take with you into whatever you built next?

I'd want to open-source it all. I think the schema layer is genuinely useful. Orchestrating data from third-party services is needed in applications across the board.

<!-- id: takeshape-24 | tags: [open-source, culture] -->
## 24. You wrote the first Serverless Framework webpack plugin to make TakeShape's TypeScript-everywhere infrastructure practical. Has TakeShape stayed close to its open-source roots, or has the agent direction pulled it more closed-source?

TakeShape is a closed-source SaaS platform. We contribute back to many of the open-source libraries we use to build it.

<!-- id: takeshape-25 | tags: [culture, values] -->
## 25. What's the cultural anchor at TakeShape that's stayed constant from the Brooklyn-co-founders days through to today?

The anchor is mutual respect. Respect for craftsmanship balanced with pragmatism. Respect for each other's abilities, and holding each other to a high standard. Respect for the health and well-being of our employees.

<!-- id: takeshape-26 | tags: [why-now, leaving, market] -->
## 26. TakeShape is your seven-year baby. What's pulling you out of it?

It's time to move on. I've loved building TakeShape for the last 7+ years, but it's time for a fresh start — to leverage the hard-fought experience and put my passion into a new project. The explosion of AI coding tools has taken some of the shine off "SaaS platform that provides API connectors" — most engineers will generate custom data models directly from each platform's API specs. The more interesting work now is creating primitives that coding agents can leverage. Instead of a third pivot, it's time for a fresh sheet.

<!-- id: takeshape-27 | tags: [next, thesis, application-first] -->
## 27. If you started fresh tomorrow, what would you actually build?

The best dev tools come out of actual need, not a vacuum — that's why TakeShape ended up doing professional services to guide its AI work. So my honest answer is: build an application first. Pick a real user problem AI now makes solvable, ship it, and let the gaps in tooling I hit along the way be the second product. I've always been drawn to making success repeatable — that's what got me into tools in the first place — but the only way I trust the tools I'd build is if they came out of trying to ship something real.

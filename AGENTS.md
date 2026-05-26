# AGENTS.md

## Project

AI Document Assistant — RAG-based PDF Q&A application.

Users upload PDFs, ask questions, and receive answers with citations.

Primary goal is NOT UI complexity.

Primary goals:

- Next.js 16 App Router experience
- AI/RAG pipeline understanding
- Retrieval measurement
- Storage abstraction
- Cost awareness
- Portfolio-quality engineering decisions

Read project requirements in:

SPEC.md


---

## Stack

Core:

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- shadcn/ui

AI:

- Vercel AI SDK
- OpenAI
- text-embedding-3-small
- gpt-4o-mini
- gpt-tokenizer

Storage:

- MemoryStore (Week 1)
- PgVectorStore (Week 2)

Testing:

- Vitest


---

## Documentation rules

Fast-moving libraries MUST use current docs.

Use Context7 MCP before implementation for:

- Next.js
- Vercel AI SDK
- OpenAI SDK
- Tailwind v4
- shadcn/ui
- pgvector
- Supabase

Do not rely purely on model memory.

Never invent APIs.


---

## Architecture rules

Server Components by default.

Client Components ONLY for:

- drag-drop upload
- chat interaction
- theme toggle
- streaming UI

Use:

Server Actions →

- upload PDF
- mutations
- delete/reset actions

Route Handlers →

- streaming responses
- chat API

Never call OpenAI from client components.

Never expose API keys.


---

## Retrieval rules

Keep responsibilities separated.

Correct:

embedText()
↓
retrieveChunks()
↓
store.search({ embedding })

Wrong:

store.search(queryText)

VectorStore must NOT know:

- OpenAI
- raw text
- embedding provider

Store accepts ready embeddings only.


---

## Chunking rules

Use:

gpt-tokenizer

Do NOT estimate:

chars / 4

Chunking:

- overlap required
- avoid broken boundaries
- optimize retrieval quality


---

## Evaluation rules

Evaluation is a differentiator.

Track:

- Recall@5
- Recall@10
- citation coverage
- latency
- estimated token usage
- estimated cost

Do NOT implement:

- LLM-as-judge
- answer correctness via another model


---

## Development rule (critical)

Never introduce more than ONE unfamiliar layer at once.

Bad:

Next.js
+ AI SDK
+ streaming
+ embeddings
  same session

Good:

upload works
→ embeddings work
→ retrieval works
→ streaming works


---

## Non-goals

Do NOT add unless explicitly requested:

- auth
- multi-user
- multi-document chat
- agents/tool-use workflows
- queues
- workers
- production observability
- background jobs

Simple > enterprise.


---

## Code style

Prefer:

- explicit code
- small functions
- minimal abstractions

Avoid:

- premature optimization
- abstraction for future possibilities
- enterprise patterns without need

Portfolio project, not SaaS.

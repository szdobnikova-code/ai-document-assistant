# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The import above carries the full project charter — read it for architecture, retrieval, chunking, evaluation, and code-style rules. This file adds the operational context not covered there.

Whenever working with any third-party library, framework API, SDK, or fast-moving technology, you MUST look up current documentation before implementation. Use the DocsExplorer subagent for efficient documentation lookup via Context7 MCP and official docs.

Whenever making architectural decisions — including introducing abstractions, refactoring, changing retrieval/persistence logic, or adding new layers — you MUST use the ArchitectureReviewer subagent to validate the approach and catch over-engineering, abstraction leakage, coupling, and unnecessary complexity.

## Commands

```bash
npm run dev     # start dev server at http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint (eslint-config-next: core-web-vitals + typescript)
```

There is no test runner wired up yet. `AGENTS.md` names Vitest as the intended framework, but it is not installed and there is no `test` script — add both when writing the first test.

## Current state vs. target

This repo is currently a fresh `create-next-app` scaffold plus shadcn/ui — the RAG application described in `AGENTS.md` / `SPEC.md` is **not built yet**. Before assuming a module exists, check: most of the documented architecture is still aspirational.

What exists today:
- `app/` — default scaffold (`layout.tsx`, `page.tsx` still shows the Next.js starter page; metadata still says "Create Next App").
- `components/ui/` — shadcn primitives (button, card, alert, input, textarea).
- `lib/utils.ts` — only the `cn()` class-merge helper.

What does NOT exist yet (build per the user-flow order in `SPEC.md`: upload → chunking → embeddings → retrieval → streaming → eval → persistence):
- No `VectorStore` interface, `MemoryStore`, or `PgVectorStore`.
- No embedding / chunking / retrieval modules in `lib/`.
- No `/eval` page, route handlers, or server actions.
- AI/tokenizer deps (Vercel AI SDK, OpenAI SDK, `gpt-tokenizer`) are **not installed** despite being listed in the stack — install them when reaching that step.

## Worth knowing

- **Next.js version**: installed version is **16.2.6** (React 19.2.4). Fetch current Next docs via Context7 before non-trivial App Router work.
- **shadcn setup**: style is `base-nova` and components are built on `@base-ui/react` (not Radix). `components.json` defines the aliases; the import alias is `@/*` → repo root.

## Conventions

- Path alias: `@/*` maps to the repo root (e.g. `@/lib/utils`, `@/components/ui/button`).
- Tailwind v4 (CSS-first config in `app/globals.css`; there is no `tailwind.config.*`).
- TypeScript is `strict`. Keep the secrets/server boundaries from `AGENTS.md`: never call OpenAI from client components, never expose API keys.

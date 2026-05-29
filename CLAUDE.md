# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The import above carries the full project charter — read it for architecture, retrieval, chunking, evaluation, and code-style rules. This file adds the operational context not covered there.

Whenever working with any third-party library, framework API, SDK, or fast-moving technology, you MUST look up current documentation before implementation. Use the DocsExplorer subagent for efficient documentation lookup via Context7 MCP and official docs.

Whenever making architectural decisions — including introducing abstractions, refactoring, changing retrieval/persistence logic, or adding new layers — you MUST use the ArchitectureReviewer subagent to validate the approach and catch over-engineering, abstraction leakage, coupling, and unnecessary complexity.

## Commands

```bash
npm run dev         # start dev server at http://localhost:3000
npm run build       # production build
npm run start       # serve the production build
npm run lint        # eslint (eslint-config-next: core-web-vitals + typescript)
npm run test        # vitest run (single pass — use in CI / verification)
npm run test:watch  # vitest (watch mode)
npm run format      # prettier . --write   (format:check for a dry run)
```

Vitest is installed and wired up: `vitest.config.ts` sets `environment: 'node'` and the `@` → repo-root alias, and tests live under `tests/` mirroring the `lib/` layout (e.g. `tests/chunk/chunk-text.test.tsx`, `tests/retrieval/cosine-similarity.test.ts`).

## Current state vs. target

The pipeline is partway built (upload → chunking → embeddings done; retrieval in progress). The later stages in `SPEC.md` are still aspirational, so before assuming a module exists, check.

What exists today:

- `app/page.tsx` — real upload UI (renders `components/upload/PdfUpload`), no longer the starter page. `app/actions/upload.ts` is the upload server action. (Note: `layout.tsx` metadata still says "Create Next App" — not yet updated.)
- `components/ui/` — shadcn primitives; `components/upload/` — the `PdfUpload` client component.
- `lib/` — `pdf/extract.ts` (PDF text extraction via `unpdf`), `chunk/chunk-text.tsx`, `embeddings/embed-text.ts`, `storage/` (`vector-store.ts` interface, `memory-store.ts`, and the `store.ts` singleton), `retrieval/cosine-similarity.ts`, and `utils.ts` (`cn()`).
- `types/document.ts` — `StoredChunk`, `Scored`, `SearchParams`, `ChunkMeta`.
- Installed AI/tokenizer deps: `openai`, `gpt-tokenizer`, `unpdf`.

What does NOT exist yet (remaining `SPEC.md` order: retrieval → streaming → eval → persistence):

Retrieval is implemented.

Current working flow:
PDF upload → text extraction → chunking → embeddings → MemoryStore → semantic search → answer generation.

Still missing:

- citations
- streaming
- chat history
- persistence / PgVectorStore
- evaluation page
- No `PgVectorStore` (only the in-memory `MemoryStore`).
- No `/eval` page, no route handlers, no chat/streaming UI.
- Vercel AI SDK is **not installed** despite being listed in the stack — install it when reaching the streaming step.

## Worth knowing

- **Next.js version**: installed version is **16.2.6** (React 19.2.4). Fetch current Next docs via Context7 before non-trivial App Router work.
- **shadcn setup**: style is `base-nova` and components are built on `@base-ui/react` (not Radix). `components.json` defines the aliases; the import alias is `@/*` → repo root.

## Conventions

- Path alias: `@/*` maps to the repo root (e.g. `@/lib/utils`, `@/components/ui/button`).
- Tailwind v4 (CSS-first config in `app/globals.css`; there is no `tailwind.config.*`).
- TypeScript is `strict`. Keep the secrets/server boundaries from `AGENTS.md`: never call OpenAI from client components, never expose API keys.

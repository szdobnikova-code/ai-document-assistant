# AI-Assisted Development

This project was built with Claude (via Claude Code) as the primary AI assistant. This document is a curated reference of the prompting patterns that produced the strongest results — not a chronological log, but a selection of decisions where AI collaboration meaningfully shaped the outcome.

Each entry shows the prompt I used, the measurable outcome, and the lesson I took away. The goal is to document a working AI workflow, not to demonstrate volume.

---

## 1. Architectural constraint — keeping the vector store embedding-only

**Context:** Designing the `VectorStore<T>` interface early in the project. The key question was where to draw the boundary: should the store accept raw text queries and handle embedding internally, or should embedding live outside the store entirely?

**Prompt:**

```
Implement Day 2 only.

Read AGENTS.md and docs/spec.md first.

Scope:
- types/document.ts
- VectorStore interface
- MemoryStore skeleton
- PDF upload UI
- Server Action for PDF upload
- PDF text extraction only

Do NOT implement embeddings, retrieval, chat, streaming, OpenAI, or eval.

Follow architecture rule:
VectorStore.search accepts ready embeddings only.
Storage must not know about OpenAI or raw text queries.
```

**Outcome:** `VectorStore<T>.search(params: { embedding: number[]; topK: number })` — the interface never touches OpenAI. `embedText()` lives in `lib/embeddings/`, `retrieveChunks()` in `lib/retrieval/`. The store receives a ready embedding and performs similarity search. This boundary held through all subsequent steps: adding `PgVectorStore`, wiring streaming chat, adding batched embeddings.

**Lesson:** Stating an architecture rule as a constraint inside the scope prompt — not as a separate design document — kept it enforced at implementation time. Claude respected it because it was in the same instruction that triggered the work.

---

## 2. Dependency decision — switching PDF parser mid-project

**Context:** Initial implementation used `pdf-parse`. Worked locally but failed on Vercel due to `DOMMatrix` / PDF.js worker resolution issues in Next.js + Turbopack. Needed a decision, not a debugging session.

**Outcome (documented in prompts log):**

Switched to `unpdf`. The decision was made explicitly and the trade-off documented:

| | |
|---|---|
| **Pros** | Simpler deployment, fewer runtime issues, reliable on Vercel |
| **Cons** | Changed dependency after initial implementation, less time debugging lower-level PDF.js compatibility |

**Lesson:** For a portfolio project, deployment compatibility outweighs time spent debugging tooling. When a library fails in the target environment and a working alternative exists, switching is the right call — and documenting *why* is what makes the decision visible to a reviewer.

---

## 3. Streaming citations — choosing the right AI SDK v6 primitive

**Context:** The streaming chat worked end-to-end, but retrieval sources were stripped before reaching the client. Three options existed in AI SDK v6: `messageMetadata`, built-in `source` part, or custom persistent data parts. Needed to pick the right one without guessing.

**Prompt:**

```
Use DocExplorer for research.

Task:
Review the attached route.ts and StreamingQuestionForm implementation.

Determine the correct AI SDK v6 approach for sending retrieval sources
from the server to the client while preserving streaming.

Use DocExplorer to verify:
- message metadata
- data parts
- UIMessage
- useChat
- toUIMessageStreamResponse

Then propose the minimal implementation needed to:
1. Stream assistant responses.
2. Attach retrieval sources to the assistant message.
3. Render those sources under the streamed answer.
4. Keep a single StreamingQuestionForm UI.
5. Avoid duplicate architectures or temporary solutions.

When answering:
- Reference the relevant AI SDK documentation.
- Explain the reasoning.
- Do not invent APIs that are not documented.
```

**Outcome:** Custom persistent data parts via `createUIMessageStream` + `createUIMessageStreamResponse`. Reasoning documented:

- `messageMetadata` — for message-level signals (model, tokens, latency), not arrays of structured chunk objects
- Built-in `source` part — fixed `{ url, title }` shape, designed for URL citations; our chunks are excerpts with filename, index, score and have no URL
- Custom `data-<name>` parts — stored in message history, strongly typed via the `UIMessage` generic, accept arbitrary structured data

`ChatUIMessage = UIMessage<never, { sources: ChunkSource[] }>` — the type is the contract between server and client. Legacy non-streaming stack deleted in the same commit.

**Lesson:** Instructing Claude to use documentation tooling (`DocExplorer`) before proposing an approach produced a justified decision rather than a guess. The reasoning why the other two options were wrong was as useful as the recommendation itself — it's what makes the choice defensible in a code review.

---

## 4. Chat persistence — shared Chat instance pattern

**Context:** Chat messages were lost on every navigation between `/upload` and `/assistant`. The question was whether AI SDK v6 had a documented persistence approach, or whether a custom solution was needed.

**Prompt:**

```
Use DocExplorer for research.

Task: Investigate chat persistence in the current implementation.

Do not ask me to repeat project architecture.

Requirements:
- Read the existing implementation first.
- Use documentation where needed (especially AI SDK v6).
- Do not invent APIs.
- Do not propose a new architecture.
- Do not generate code yet.

Research goals:
1. Explain where chat messages are currently stored.
2. Explain why chat history disappears when navigating between pages.
3. Determine whether AI SDK v6 provides a recommended persistence approach.
4. Evaluate whether sessionStorage is appropriate for the current architecture.
5. Propose the smallest possible solution that preserves chat history between
   route navigations.

Output format:
- Current state flow
- Root cause
- Relevant AI SDK findings
- Recommended minimal patch
- Tradeoffs

Do not generate code until I approve the approach.
```

**Outcome:** Root cause identified: `useChat` keeps messages in component-local state; navigating away from `/assistant` unmounts the component and the state is garbage-collected. Fix: hoist a shared `Chat<ChatUIMessage>` instance into a `ChatProvider` in `app/layout.tsx`. Because the root layout doesn't unmount on client-side navigation, the `Chat` instance survives `/upload` ↔ `/assistant` transitions.

Three files touched: `components/chat/chat-provider.tsx` (new), `app/layout.tsx` (wrap children), `streaming-question-form.tsx` (switch from `useChat({ transport })` to `useChat({ chat })`).

Documented tradeoff: survives in-app navigation, does not survive hard reload. Acceptable — chat persistence across reloads is explicitly a non-goal in AGENTS.md.

**Lesson:** Separating research from implementation ("do not generate code until I approve the approach") produced a better decision. The research phase surfaced a documented SDK pattern instead of an improvised sessionStorage solution that the docs were silent on. Approving the approach before implementation also meant the code came out clean on the first pass.

---

## 5. UX decision — clearing chat on document upload

**Context:** Uploading a new document called `vectorStore.reset()` on the server, but the chat UI preserved history. This created ghost citations (source chips referencing chunks that no longer existed) and silent context switches (follow-up questions retrieved from a different document with no signal to the user).

**Prompt:**

```
Current architecture supports a single active document.
Uploading a new document replaces the active document.
Should the chat session be automatically cleared?
Analyze the UX implications and recommend the smallest consistent behavior.
Do not implement code.
```

**Outcome:** Recommendation: clear immediately on successful upload. Three UX problems with the status quo identified:

1. **Ghost citations** — source chips reference `documentId`s no longer in the store
2. **Silent context switch** — follow-up questions retrieve from the wrong document
3. **Architectural mismatch** — the store enforces single-active-document; the chat UI implied multi-document continuity

Implementation: `clearChat()` exposed via `useClearDocumentChat()` hook from `ChatProvider`; called in `pdf-upload.tsx` on `state.status === 'success'`. Confirmation dialog added before replacement when a document already exists.

Edge cases documented: re-uploading the same file clears chat (accepted); failed uploads do not clear chat (correct — `vectorStore.reset()` only runs on success).

**Lesson:** Asking for a UX analysis before any code produced a decision with explicit reasoning that survived review. The architectural mismatch framing — "the store says one thing, the UI says another" — was the argument that made the decision obvious. A prompt that goes straight to implementation skips that framing.

---

## 6. Code review — catching infrastructure defects before they hit production

**Context:** After implementing pgvector persistence, asked Claude to review the last 10 commits as a senior engineer. Not a style review — a production-readiness pass.

**Prompt:**

```
review the current branch changes
```

**Outcome:** Four high-priority defects surfaced:

1. `getPostgresPool()` returned a new `Pool` on every call — no singleton, connections leaked on every query
2. `EMBED_LIMIT = 3` silently embedded only the first 3 chunks of every upload — retrieval couldn't reach >95% of any real PDF
3. `.idea/dataSources.xml` committed to git — Supabase pooler hostname in public history
4. `vectorStore.reset()` wiped `document_chunks` but left orphan `documents` rows (cascade ran the wrong direction)

All four fixed in a follow-up commit: pool singleton, `embedTexts(string[])` batch API replacing the capped loop, `.idea/` untracked, `clearDocuments()` added to enforce single-active-document semantics at the DB level.

**Lesson:** A short "review the current branch changes" prompt with no scope constraints produced a more useful review than a checklist-style prompt would have. The reviewer framing — "what would block this from shipping" — surfaced the `EMBED_LIMIT` issue, which was the most impactful bug: the demo was technically working but returning "I couldn't find that" for most questions on any real document.

---

## 7. Batched embeddings — removing the artificial chunk cap

**Context:** After the code review identified `EMBED_LIMIT = 3`, the fix required adding a batched embedding function. The OpenAI array input API accepts up to 2048 inputs per call — the existing `embedText(string)` only handled a single input.

**Prompt:**

```
fix the high-priority issues from recent code review
```

*(The prompt was short because the research and planning had already happened in the review step.)*

**Outcome:** `embedTexts(string[]): Promise<number[][]>` added to `lib/embeddings/embed-text.ts`. Batch size 100 (safe, predictable). Usage tracking wired per batch — `usageTracker.record('embedding', model, response.usage?.total_tokens ?? 0, 0)`. `EMBED_LIMIT` constant deleted from `upload.ts`; the upload now embeds all chunks in one or a few round-trips.

Single-active-document semantics enforced at DB level via `clearDocuments()` (deletes from `documents`, CASCADE removes `document_chunks`) + `usePgVector` flag exported from `store.ts` to gate the pg calls in the memory path.

**Lesson:** Breaking work into (1) research → (2) planning → (3) implementation meant the implementation prompt could be short. The context was already established; Claude didn't need to re-derive it. Short implementation prompts after thorough research produce cleaner code than long prompts that mix strategy and execution.

---

## What I learned about working with Claude on this project

1. **Architecture constraints belong in the scope prompt.** Stating "VectorStore.search accepts ready embeddings only" in the same instruction that triggered Day 2 kept it enforced. A separate design document doesn't work as well.

2. **Research before implementation produces better decisions.** Asking Claude to verify SDK documentation before proposing an approach — and explicitly forbidding code generation until the approach was approved — caught two cases where the "obvious" solution (sessionStorage, built-in source parts) was the wrong one.

3. **Short prompts work when context is already established.** "Review the current branch changes" and "fix the high-priority issues" were the two most productive prompts in the project. Both relied on context built in prior sessions. Prompt length is not correlated with output quality.

4. **Asking for trade-offs makes decisions defensible.** The PDF parser switch, the citation primitive choice, the chat-clear decision — all have documented reasoning because the prompts asked for it. Useful months later when the decision comes up in a code review.

5. **A code review prompt surfaces what checklists miss.** The `EMBED_LIMIT = 3` bug was present for weeks and passed lint, tests, and build. A "review as a senior engineer" prompt found it in one pass. Scope the review to recent changes, not the whole repo.

The collaboration pattern that worked best: I owned the *what* and the *why*; Claude owned the *how* and the verification. When I reversed that — let Claude choose the strategy without documented constraints — results were harder to defend.

# AI Document Assistant

RAG-based PDF Q&A application.

Users upload documents, ask questions, and receive cited answers.

---

# Goals

This project exists to close specific gaps:

1. Next.js 16 App Router
2. AI integration
3. RAG pipelines
4. Streaming responses
5. Storage abstraction
6. Retrieval evaluation
7. Cost measurement

Secondary goal:

Strong portfolio showcase.

---

# Success criteria

Project is successful if it demonstrates:

- working end-to-end RAG flow
- citations
- retrieval measurement
- persistence abstraction
- realistic README metrics
- deployable app

NOT if it has many features.

---

# User flow

Upload PDF

↓

Extract text

↓

Chunk document

↓

Generate embeddings

↓

Store chunks + embeddings

↓

Ask question

↓

Embed query

↓

Retrieve top-k chunks

↓

Build prompt

↓

Generate response

↓

Show citations

---

# Architecture

Week 1:

MemoryStore

interface:

VectorStore<T>

implementations:

MemoryStore
PgVectorStore (later)

Storage must be swappable.

Retrieval must not depend on persistence.

Embedding generation must not depend on storage.

---

# Retrieval

Week 1:

Cosine similarity
Top-k retrieval

Known limitations:

- O(n)
- no reranking
- no hybrid search

Acceptable for MVP.

Potential future improvements:

- reranking
- hybrid retrieval
- ANN search

Document limitations in README.

---

# Evaluation

Evaluation page:

/eval

Track:

- Recall@5
- Recall@10
- citation coverage
- avg latency
- estimated cost/query
- estimated tokens/query

Evaluation uses:

fixed question set
expected chunk ids

No LLM judge.

---

# Cost strategy

Use:

text-embedding-3-small
gpt-4o-mini

Requirements:

OpenAI hard limit:
$5/month

Track:

- tokens
- estimated cost
- latency

---

# Execution strategy

Critical rule:

Never add multiple unfamiliar layers simultaneously.

Order:

PDF upload

↓

Chunking

↓

Embeddings

↓

Retrieval

↓

Streaming

↓

Evaluation

↓

Persistence

---

# Week 1

Goal:

Working end-to-end system.

Deliverable:

upload
→ ask
→ answer
→ citations

---

# Week 2

Goal:

Differentiate project.

Add:

evaluation
metrics
cost tracking
pgvector
benchmarks
README

---

# Final README should include

- architecture
- metrics
- limitations
- benchmark numbers
- cost discussion
- retrieval discussion

Important:

Concrete numbers > feature count

Examples:

Recall@5: 84%

Avg latency: 1.2s

Avg cost/query: $0.0008


These matter more than another UI feature.

---

# Non-goals

Excluded intentionally:

- auth
- multi-user
- multi-document chat
- queues
- background jobs
- agent workflows
- production infra

Reason:

Project optimizes for learning and portfolio value.

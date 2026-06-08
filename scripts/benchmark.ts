import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

import { extractPdfText } from '@/lib/pdf/extract';
import { chunkText } from '@/lib/chunk/chunk-text';
import { embedTexts } from '@/lib/embeddings/embed-text';
import { retrieveChunks } from '@/lib/retrieval/retrieve-chunks';
import { documentStore } from '@/lib/storage/document-store';
import { usageTracker } from '@/lib/usage/tracker';
import type { StoredChunk } from '@/types/document';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PDF_PATH = resolve(ROOT, 'tests/fixtures/corpus.pdf');
const QUESTIONS_PATH = resolve(ROOT, 'tests/eval/questions.json');
const RESULTS_PATH = resolve(ROOT, 'eval-results.json');

const GENERATION_MODEL = 'gpt-4o-mini';
const TOP_K_PRODUCTION = 3;
const TOP_K_EVAL = 10;
const ITERATIONS = Number(process.env.BENCHMARK_ITERATIONS ?? 3);

const SYSTEM_PROMPT = [
  'You answer questions about a document using ONLY the provided context passages.',
  'Do not use outside knowledge and do not invent information.',
  'When using information from a passage, cite it with its passage number like [1] or [2].',
  'Every factual claim should be supported by a citation.',
  'If the answer is not contained in the context, reply exactly: "I couldn\'t find that in the document."',
  'Reply as plain prose only — no markdown, no asterisks, no headings, no bullet lists, no bold or italics. One or two short paragraphs.',
].join(' ');

interface Question {
  id: string;
  question: string;
  expectedChunkIndices: number[];
}

interface QuestionsFile {
  corpus: string;
  notes: string;
  questions: Question[];
}

interface PerQuestion {
  id: string;
  question: string;
  expected: number[];
  retrievedRanked: number[];
  recallAt1: number;
  recallAt3: number;
  recallAt5: number;
  iterations: number;
  retrievalMsSamples: number[];
  generationMsSamples: number[];
  endToEndMsSamples: number[];
  retrievalMsMedian: number;
  generationMsMedian: number;
  endToEndMsMedian: number;
  generationInputTokens: number;
  generationOutputTokens: number;
}

interface RunMetrics {
  store: 'memory' | 'pg';
  ranAt: string;
  corpus: string;
  chunkCount: number;
  questionCount: number;
  ingestionMs: number;
  recallAt1: number;
  recallAt3: number;
  recallAt5: number;
  avgRetrievalMs: number;
  medianRetrievalMs: number;
  avgGenerationMs: number;
  medianGenerationMs: number;
  avgEndToEndMs: number;
  medianEndToEndMs: number;
  avgTokensPerQuery: number;
  avgCostUsdPerQuery: number;
  perQuestion: PerQuestion[];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

async function ingest(): Promise<{ ingestionMs: number; chunkCount: number }> {
  const buffer = await readFile(PDF_PATH);
  const data = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;

  const start = performance.now();
  const extracted = await extractPdfText(data, 'corpus.pdf');
  const chunks = chunkText(extracted.text);
  const embeddings = await embedTexts(chunks.map((c) => c.content));
  const stored: StoredChunk[] = chunks.map((c, i) => ({
    id: `${extracted.meta.id}-${c.index}`,
    text: c.content,
    embedding: embeddings[i],
    tokenCount: c.tokenCount,
    meta: {
      documentId: extracted.meta.id,
      filename: extracted.meta.filename,
      index: c.index,
    },
  }));
  await documentStore.replaceActive(extracted.meta, stored);
  const ingestionMs = performance.now() - start;
  return { ingestionMs, chunkCount: stored.length };
}

function recallAtK(retrieved: number[], expected: number[], k: number): number {
  if (expected.length === 0) return 1;
  const topK = new Set(retrieved.slice(0, k));
  const hits = expected.filter((idx) => topK.has(idx)).length;
  return hits / expected.length;
}

async function runQuestion(q: Question): Promise<PerQuestion> {
  const retrievalMsSamples: number[] = [];
  const generationMsSamples: number[] = [];
  const endToEndMsSamples: number[] = [];
  let retrievedIndices: number[] = [];
  let lastInputTokens = 0;
  let lastOutputTokens = 0;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const retrievalStart = performance.now();
    const scored = await retrieveChunks(q.question, TOP_K_EVAL);
    const retrievalMs = performance.now() - retrievalStart;
    if (iter === 0) {
      retrievedIndices = scored.map((s) => s.chunk.meta.index);
    }

    const top = scored.slice(0, TOP_K_PRODUCTION);
    const passages = top
      .map(({ chunk }, i) => `[${i + 1}] ${chunk.text}`)
      .join('\n\n');

    const genStart = performance.now();
    const { usage } = await generateText({
      model: openai(GENERATION_MODEL),
      system: SYSTEM_PROMPT,
      prompt: `Context passages:\n\n${passages}\n\nQuestion: ${q.question}`,
      temperature: 0.2,
      maxOutputTokens: 500,
    });
    const generationMs = performance.now() - genStart;

    const inputTokens = usage.inputTokens ?? 0;
    const outputTokens = usage.outputTokens ?? 0;
    usageTracker.record(
      'generation',
      GENERATION_MODEL,
      inputTokens,
      outputTokens,
    );
    lastInputTokens = inputTokens;
    lastOutputTokens = outputTokens;

    retrievalMsSamples.push(retrievalMs);
    generationMsSamples.push(generationMs);
    endToEndMsSamples.push(retrievalMs + generationMs);
  }

  return {
    id: q.id,
    question: q.question,
    expected: q.expectedChunkIndices,
    retrievedRanked: retrievedIndices,
    recallAt1: recallAtK(retrievedIndices, q.expectedChunkIndices, 1),
    recallAt3: recallAtK(retrievedIndices, q.expectedChunkIndices, 3),
    recallAt5: recallAtK(retrievedIndices, q.expectedChunkIndices, 5),
    iterations: ITERATIONS,
    retrievalMsSamples,
    generationMsSamples,
    endToEndMsSamples,
    retrievalMsMedian: median(retrievalMsSamples),
    generationMsMedian: median(generationMsSamples),
    endToEndMsMedian: median(endToEndMsSamples),
    generationInputTokens: lastInputTokens,
    generationOutputTokens: lastOutputTokens,
  };
}

async function closePoolIfPg(): Promise<void> {
  if (process.env.VECTOR_STORE !== 'pg') return;
  try {
    const { getPostgresPool } = await import('@/lib/db/postgres');
    await getPostgresPool().end();
  } catch {
    // ignore — pool may have never been initialized
  }
}

async function main() {
  const storeMode: 'memory' | 'pg' =
    process.env.VECTOR_STORE === 'pg' ? 'pg' : 'memory';
  console.log(`[benchmark] store=${storeMode}`);

  usageTracker.reset();

  const questionsFile = JSON.parse(
    await readFile(QUESTIONS_PATH, 'utf8'),
  ) as QuestionsFile;
  const questions = questionsFile.questions;

  console.log(`[benchmark] ingesting corpus...`);
  const { ingestionMs, chunkCount } = await ingest();
  console.log(
    `[benchmark] ingested ${chunkCount} chunks in ${ingestionMs.toFixed(0)}ms`,
  );

  const usageBeforeQueries = usageTracker.getSummary();

  const perQuestion: PerQuestion[] = [];
  for (const q of questions) {
    process.stdout.write(`[benchmark] ${q.id} `);
    const res = await runQuestion(q);
    perQuestion.push(res);
    console.log(
      `R@1=${res.recallAt1.toFixed(2)} R@3=${res.recallAt3.toFixed(2)} R@5=${res.recallAt5.toFixed(2)} ` +
        `retr_med=${res.retrievalMsMedian.toFixed(0)}ms gen_med=${res.generationMsMedian.toFixed(0)}ms ` +
        `e2e_med=${res.endToEndMsMedian.toFixed(0)}ms (${res.iterations} iter) ` +
        `ranked=[${res.retrievedRanked.slice(0, 3).join(',')}…]`,
    );
  }

  const usageAfterQueries = usageTracker.getSummary();
  const N = perQuestion.length;
  const totalCalls = N * ITERATIONS;
  const sum = (vals: number[]): number => vals.reduce((s, v) => s + v, 0);

  const queryTokens =
    usageAfterQueries.totals.totalTokens -
    usageBeforeQueries.totals.totalTokens;
  const queryCost =
    usageAfterQueries.totals.estimatedUsdCost -
    usageBeforeQueries.totals.estimatedUsdCost;

  const retrMedians = perQuestion.map((r) => r.retrievalMsMedian);
  const genMedians = perQuestion.map((r) => r.generationMsMedian);
  const e2eMedians = perQuestion.map((r) => r.endToEndMsMedian);

  const metrics: RunMetrics = {
    store: storeMode,
    ranAt: new Date().toISOString(),
    corpus: questionsFile.corpus,
    chunkCount,
    questionCount: N,
    ingestionMs,
    recallAt1: sum(perQuestion.map((r) => r.recallAt1)) / N,
    recallAt3: sum(perQuestion.map((r) => r.recallAt3)) / N,
    recallAt5: sum(perQuestion.map((r) => r.recallAt5)) / N,
    avgRetrievalMs: sum(retrMedians) / N,
    medianRetrievalMs: median(retrMedians),
    avgGenerationMs: sum(genMedians) / N,
    medianGenerationMs: median(genMedians),
    avgEndToEndMs: sum(e2eMedians) / N,
    medianEndToEndMs: median(e2eMedians),
    avgTokensPerQuery: queryTokens / totalCalls,
    avgCostUsdPerQuery: queryCost / totalCalls,
    perQuestion,
  };

  let existing: Record<string, RunMetrics> = {};
  if (existsSync(RESULTS_PATH)) {
    try {
      existing = JSON.parse(await readFile(RESULTS_PATH, 'utf8'));
    } catch {
      existing = {};
    }
  }
  existing[storeMode] = metrics;
  await writeFile(RESULTS_PATH, JSON.stringify(existing, null, 2) + '\n');

  console.log();
  console.log(`## Benchmark results — store=${storeMode}`);
  console.log();
  console.log('| Metric | Value |');
  console.log('| --- | --- |');
  console.log(`| Corpus | ${questionsFile.corpus} (${chunkCount} chunks) |`);
  console.log(`| Questions | ${N} (× ${ITERATIONS} iterations each) |`);
  console.log(`| Recall@1 | ${(metrics.recallAt1 * 100).toFixed(1)}% |`);
  console.log(`| Recall@3 | ${(metrics.recallAt3 * 100).toFixed(1)}% |`);
  console.log(`| Recall@5 | ${(metrics.recallAt5 * 100).toFixed(1)}% |`);
  console.log(
    `| Median retrieval latency | ${metrics.medianRetrievalMs.toFixed(0)} ms (avg ${metrics.avgRetrievalMs.toFixed(0)} ms) |`,
  );
  console.log(
    `| Median generation latency | ${metrics.medianGenerationMs.toFixed(0)} ms (avg ${metrics.avgGenerationMs.toFixed(0)} ms) |`,
  );
  console.log(
    `| Median end-to-end latency | ${metrics.medianEndToEndMs.toFixed(0)} ms (avg ${metrics.avgEndToEndMs.toFixed(0)} ms) |`,
  );
  console.log(
    `| Avg tokens / query | ${metrics.avgTokensPerQuery.toFixed(0)} |`,
  );
  console.log(
    `| Avg cost / query | $${metrics.avgCostUsdPerQuery.toFixed(5)} |`,
  );
  console.log(
    `| Ingestion (one-shot) | ${metrics.ingestionMs.toFixed(0)} ms |`,
  );
  console.log();
  console.log(`Wrote ${RESULTS_PATH}`);

  await closePoolIfPg();
}

main().catch(async (err) => {
  console.error(err);
  await closePoolIfPg();
  process.exit(1);
});

import 'server-only';

import { getOpenAIClient } from '@/lib/openai/client';
import { usageTracker } from '@/lib/usage/tracker';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBED_BATCH_SIZE = 100;

// Turns a single string into an embedding vector. Callers pass the result to
// the vector store — the store never sees raw text or OpenAI (see AGENTS.md).
export async function embedText(text: string): Promise<number[]> {
  const response = await getOpenAIClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    encoding_format: 'float',
  });

  const embedding = response.data[0]?.embedding;

  if (!embedding) {
    throw new Error('OpenAI returned no embedding');
  }

  usageTracker.record(
    'embedding',
    EMBEDDING_MODEL,
    response.usage?.total_tokens ?? 0,
    0,
  );

  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
    const response = await getOpenAIClient().embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      encoding_format: 'float',
    });

    if (response.data.length !== batch.length) {
      throw new Error(
        `OpenAI returned ${response.data.length} embeddings for ${batch.length} inputs`,
      );
    }

    usageTracker.record(
      'embedding',
      EMBEDDING_MODEL,
      response.usage?.total_tokens ?? 0,
      0,
    );

    for (const item of response.data) out.push(item.embedding);
  }

  return out;
}

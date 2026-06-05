import 'server-only';

import { getOpenAIClient } from '@/lib/openai/client';
import { usageTracker } from '@/lib/usage/tracker';

const EMBEDDING_MODEL = 'text-embedding-3-small';

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

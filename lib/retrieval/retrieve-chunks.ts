import 'server-only';

import { embedText } from '@/lib/embeddings/embed-text';
import { memoryStore } from '@/lib/storage/store';
import type { Scored } from '@/types/document';

// Documented retrieval flow: embedText() -> retrieveChunks() -> store.search().
// The store stays embedding-only; raw query text is turned into an embedding here.
export async function retrieveChunks(
  query: string,
  topK = 3,
): Promise<Scored[]> {
  const embedding = await embedText(query);
  return memoryStore.search({ embedding, topK });
}

import type { VectorStore } from './vector-store';
import type {
  StoredChunk,
  Scored,
  SearchParams,
  ChunkMeta,
} from '@/types/document';
import { cosineSimilarity } from '@/lib/retrieval/cosine-similarity';

export class MemoryStore<T = ChunkMeta> implements VectorStore<T> {
  private items: StoredChunk<T>[] = [];

  async add(items: StoredChunk<T>[]): Promise<void> {
    this.items.push(...items);
  }

  async search(params: SearchParams): Promise<Scored<T>[]> {
    const { embedding, topK } = params;
    if (topK <= 0) {
      throw new Error('MemoryStore.search: topK must be > 0');
    }

    const scored: Scored<T>[] = [];
    for (const chunk of this.items) {
      if (!chunk.embedding) continue;
      scored.push({
        chunk,
        score: cosineSimilarity(embedding, chunk.embedding),
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  async reset(): Promise<void> {
    this.items = [];
  }
}

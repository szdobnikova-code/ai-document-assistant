import type { VectorStore } from './vector-store';
import type {
  StoredChunk,
  Scored,
  SearchParams,
  ChunkMeta,
} from '@/types/document';

export class MemoryStore<T = ChunkMeta> implements VectorStore<T> {
  private items: StoredChunk<T>[] = [];

  async add(items: StoredChunk<T>[]): Promise<void> {
    this.items.push(...items);
  }

  // Cosine-similarity retrieval is a later step (SPEC "Retrieval"). Fail loud
  // so nothing silently depends on it before it's implemented.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(_params: SearchParams): Promise<Scored<T>[]> {
    throw new Error('MemoryStore.search not implemented yet (retrieval step)');
  }

  async reset(): Promise<void> {
    this.items = [];
  }
}

import type {
  StoredChunk,
  Scored,
  SearchParams,
  ChunkMeta,
} from '@/types/document';

// Storage accepts ready embeddings only — never raw text or an embedding provider.
export interface VectorStore<T = ChunkMeta> {
  add(items: StoredChunk<T>[]): Promise<void>;
  search(params: SearchParams): Promise<Scored<T>[]>;
  reset(): Promise<void>;
}

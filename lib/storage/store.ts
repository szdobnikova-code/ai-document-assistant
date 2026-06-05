import { MemoryStore } from './memory-store';
import type { ChunkMeta } from '@/types/document';
import { VectorStore } from '@/lib/storage/vector-store';
import { PgVectorStore } from '@/lib/storage/pg-vector-store';

const usePgVector = process.env.VECTOR_STORE === 'pg';

export const vectorStore: VectorStore<ChunkMeta> = usePgVector
  ? new PgVectorStore<ChunkMeta>()
  : new MemoryStore<ChunkMeta>();

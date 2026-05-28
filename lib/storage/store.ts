import { MemoryStore } from './memory-store';
import type { ChunkMeta } from '@/types/document';

// Single in-memory store for the app. Ephemeral by design: resets on server
// restart and is per-instance in serverless. Fine for Week 1 (no retrieval yet).
export const memoryStore = new MemoryStore<ChunkMeta>();

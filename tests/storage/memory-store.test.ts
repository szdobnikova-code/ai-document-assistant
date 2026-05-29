import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@/lib/storage/memory-store';
import type { StoredChunk } from '@/types/document';

function chunk(id: string, embedding?: number[]): StoredChunk {
  return {
    id,
    text: `text-${id}`,
    embedding,
    meta: { documentId: 'doc', filename: 'doc.pdf', index: 0 },
  };
}

describe('MemoryStore.search', () => {
  it('returns most similar chunks first', async () => {
    const store = new MemoryStore();
    // Query [1, 0]; chunks ordered from least to most aligned with it.
    await store.add([
      chunk('far', [0, 1]), // orthogonal -> score ~0
      chunk('near', [1, 0]), // identical -> score ~1
      chunk('mid', [1, 1]), // 45deg -> score ~0.707
    ]);

    const results = await store.search({ embedding: [1, 0], topK: 3 });

    expect(results.map((r) => r.chunk.id)).toEqual(['near', 'mid', 'far']);
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[1].score).toBeGreaterThan(results[2].score);
  });

  it('respects topK', async () => {
    const store = new MemoryStore();
    await store.add([
      chunk('a', [1, 0]),
      chunk('b', [0, 1]),
      chunk('c', [1, 1]),
    ]);

    const results = await store.search({ embedding: [1, 0], topK: 2 });

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.chunk.id)).toEqual(['a', 'c']);
  });

  it('skips chunks without embedding', async () => {
    const store = new MemoryStore();
    await store.add([
      chunk('embedded', [1, 0]),
      chunk('no-embedding'), // undefined embedding
    ]);

    const results = await store.search({ embedding: [1, 0], topK: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].chunk.id).toBe('embedded');
  });

  it('throws on invalid topK', async () => {
    const store = new MemoryStore();
    await store.add([chunk('a', [1, 0])]);

    await expect(
      store.search({ embedding: [1, 0], topK: 0 }),
    ).rejects.toThrow();
    await expect(
      store.search({ embedding: [1, 0], topK: -1 }),
    ).rejects.toThrow();
  });
});

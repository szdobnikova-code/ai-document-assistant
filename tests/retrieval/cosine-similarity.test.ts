import { describe, expect, it } from 'vitest';
import { cosineSimilarity } from '@/lib/retrieval/cosine-similarity';

describe('cosineSimilarity', () => {
  it('returns ~1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('returns ~0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('returns ~-1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [-1, -2, -3])).toBeCloseTo(-1);
  });

  it('throws on empty vectors', () => {
    expect(() => cosineSimilarity([], [])).toThrow();
  });

  it('throws on length mismatch', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
  });

  it('throws on zero-magnitude vectors', () => {
    expect(() => cosineSimilarity([0, 0], [1, 2])).toThrow();
  });
});

import { describe, expect, it } from 'vitest';
import { chunkText } from '@/lib/chunk/chunk-text';

describe('chunkText', () => {
  it('returns one chunk for short text', () => {
    const result = chunkText('Hello world', { chunkSize: 100 });
    expect(result).toHaveLength(1);
    expect(result[0].content).toContain('Hello');
  });

  it('splits text into multiple chunks', () => {
    const text = 'Test'.repeat(1000);
    const result = chunkText(text, { chunkSize: 100, overlap: 20 });
    expect(result.length).toBeGreaterThan(1);
  });

  it('preserves overlap', () => {
    const text = 'test '.repeat(500);
    const result = chunkText(text, { chunkSize: 100, overlap: 20 });
    const firstChunk = result[0].content;
    const secondChunk = result[1].content;
    expect(firstChunk).not.toEqual(secondChunk);
  });

  it('throws error when overlap >= chunkSize', () => {
    expect(() => chunkText('text', { chunkSize: 100, overlap: 100 })).toThrow();
  });
});

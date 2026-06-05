import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();

vi.mock('@/lib/openai/client', () => ({
  getOpenAIClient: () => ({
    embeddings: { create: createMock },
  }),
}));

import { embedText } from '@/lib/embeddings/embed-text';
import { usageTracker } from '@/lib/usage/tracker';

describe('embedText', () => {
  beforeEach(() => {
    createMock.mockReset();
    usageTracker.reset();
  });

  it('returns the embedding and records token usage', async () => {
    createMock.mockResolvedValueOnce({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
      usage: { prompt_tokens: 42, total_tokens: 42 },
    });

    const embedding = await embedText('hello world');

    expect(embedding).toEqual([0.1, 0.2, 0.3]);

    const summary = usageTracker.getSummary();
    expect(summary.totals.inputTokens).toBe(42);
    expect(summary.totals.outputTokens).toBe(0);
    expect(summary.byModel['text-embedding-3-small']).toMatchObject({
      calls: 1,
      inputTokens: 42,
    });
  });

  it('records zero tokens when the response omits usage', async () => {
    createMock.mockResolvedValueOnce({
      data: [{ embedding: [1, 0] }],
      // no usage field
    });

    await embedText('x');

    expect(usageTracker.getSummary().totals.inputTokens).toBe(0);
    expect(
      usageTracker.getSummary().byModel['text-embedding-3-small'].calls,
    ).toBe(1);
  });

  it('throws and does not record usage when no embedding is returned', async () => {
    createMock.mockResolvedValueOnce({
      data: [],
      usage: { prompt_tokens: 7, total_tokens: 7 },
    });

    await expect(embedText('x')).rejects.toThrow(
      'OpenAI returned no embedding',
    );
    expect(usageTracker.getSummary().totals.totalTokens).toBe(0);
  });
});

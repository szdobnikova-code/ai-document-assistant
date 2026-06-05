import { beforeEach, describe, expect, it } from 'vitest';
import { usageTracker } from '@/lib/usage/tracker';

describe('usageTracker', () => {
  beforeEach(() => {
    usageTracker.reset();
  });

  it('starts at zero', () => {
    const summary = usageTracker.getSummary();
    expect(summary.totals).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedUsdCost: 0,
    });
    expect(summary.byModel).toEqual({});
  });

  it('accumulates totals across multiple records', () => {
    usageTracker.record('embedding', 'text-embedding-3-small', 1000, 0);
    usageTracker.record('generation', 'gpt-4o-mini', 500, 200);

    const { totals } = usageTracker.getSummary();
    expect(totals.inputTokens).toBe(1500);
    expect(totals.outputTokens).toBe(200);
    expect(totals.totalTokens).toBe(1700);
    // 1000 * 0.02/1M + 500 * 0.15/1M + 200 * 0.60/1M
    // = 0.00002 + 0.000075 + 0.00012 = 0.000215
    expect(totals.estimatedUsdCost).toBeCloseTo(0.000215, 8);
  });

  it('groups by model and counts calls', () => {
    usageTracker.record('generation', 'gpt-4o-mini', 100, 50);
    usageTracker.record('generation', 'gpt-4o-mini', 200, 80);

    const { byModel } = usageTracker.getSummary();
    expect(byModel['gpt-4o-mini']).toMatchObject({
      calls: 2,
      inputTokens: 300,
      outputTokens: 130,
    });
  });

  it('treats unknown models as zero-cost', () => {
    usageTracker.record('generation', 'mystery-model', 1000, 1000);

    const { totals, byModel } = usageTracker.getSummary();
    expect(totals.totalTokens).toBe(2000);
    expect(totals.estimatedUsdCost).toBe(0);
    expect(byModel['mystery-model'].estimatedUsdCost).toBe(0);
  });

  it('reset clears all state', () => {
    usageTracker.record('embedding', 'text-embedding-3-small', 1000, 0);
    usageTracker.reset();

    const summary = usageTracker.getSummary();
    expect(summary.totals.totalTokens).toBe(0);
    expect(summary.byModel).toEqual({});
  });
});

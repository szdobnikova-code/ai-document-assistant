import { describe, expect, it } from 'vitest';
import { MODEL_PRICING, costFor } from '@/lib/usage/pricing';

describe('costFor', () => {
  it('computes gpt-4o-mini cost from input + output', () => {
    // 1000 in * $0.15/1M + 500 out * $0.60/1M = 0.00015 + 0.0003
    expect(costFor('gpt-4o-mini', 1000, 500)).toBeCloseTo(0.00045, 8);
  });

  it('computes embedding cost from input only', () => {
    // 1_000_000 in * $0.02/1M = 0.02
    expect(costFor('text-embedding-3-small', 1_000_000, 0)).toBeCloseTo(0.02);
  });

  it('returns 0 for unknown models', () => {
    expect(costFor('mystery-model', 9999, 9999)).toBe(0);
  });

  it('returns 0 for zero tokens on a known model', () => {
    expect(costFor('gpt-4o-mini', 0, 0)).toBe(0);
  });

  it('ignores output tokens for embedding-only pricing', () => {
    // output multiplier is 0, so adding output tokens must not affect cost
    const inputOnly = costFor('text-embedding-3-small', 500, 0);
    const withOutput = costFor('text-embedding-3-small', 500, 999);
    expect(withOutput).toBe(inputOnly);
  });

  it('exposes the two production models', () => {
    expect(MODEL_PRICING).toHaveProperty('gpt-4o-mini');
    expect(MODEL_PRICING).toHaveProperty('text-embedding-3-small');
  });
});

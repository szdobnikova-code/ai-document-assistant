import { beforeEach, describe, expect, it } from 'vitest';
import { GET } from '@/app/api/usage/route';
import { usageTracker } from '@/lib/usage/tracker';
import type { UsageSummary } from '@/lib/usage/types';

describe('GET /api/usage', () => {
  beforeEach(() => {
    usageTracker.reset();
  });

  it('returns the current usage summary as JSON', async () => {
    usageTracker.record('generation', 'gpt-4o-mini', 100, 50);

    const res = await GET();
    expect(res.headers.get('Cache-Control')).toBe('no-store');

    const body = (await res.json()) as UsageSummary;
    expect(body.totals.inputTokens).toBe(100);
    expect(body.totals.outputTokens).toBe(50);
    expect(body.totals.totalTokens).toBe(150);
    expect(body.byModel['gpt-4o-mini'].calls).toBe(1);
    expect(typeof body.sessionStartedAt).toBe('number');
  });

  it('reflects an empty tracker as zero totals', async () => {
    const res = await GET();
    const body = (await res.json()) as UsageSummary;

    expect(body.totals).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedUsdCost: 0,
    });
    expect(body.byModel).toEqual({});
  });
});

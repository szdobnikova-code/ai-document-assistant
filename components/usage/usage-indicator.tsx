'use client';

import { useEffect, useState } from 'react';
import type { UsageSummary } from '@/lib/usage/types';

const REFRESH_MS = 5000;

export function UsageIndicator() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/usage', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as UsageSummary;
        if (!cancelled) setSummary(data);
      } catch {
        // Network/dev hiccups are non-fatal — the indicator stays on its last value.
      }
    };

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!summary) {
    return null;
  }

  const { totalTokens, estimatedUsdCost } = summary.totals;

  return (
    <span
      className="text-muted-foreground font-mono text-xs tabular-nums"
      title={`Input ${summary.totals.inputTokens} · Output ${summary.totals.outputTokens}`}
    >
      Σ {totalTokens.toLocaleString()} tok · ~${estimatedUsdCost.toFixed(4)}
    </span>
  );
}

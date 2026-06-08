'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

import type { UsageSummary } from '@/lib/usage/types';

const REFRESH_MS = 5000;

export function UsageBlock() {
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

  const totalTokens = summary?.totals.totalTokens ?? 0;
  const cost = summary?.totals.estimatedUsdCost ?? 0;
  const inputTokens = summary?.totals.inputTokens ?? 0;
  const outputTokens = summary?.totals.outputTokens ?? 0;

  return (
    <div className="border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col gap-1 rounded-lg border p-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <span>Session Usage</span>
        <Info
          className="size-3.5 opacity-70"
          aria-label={`Input ${inputTokens.toLocaleString()} · Output ${outputTokens.toLocaleString()}`}
        />
      </div>
      <div className="text-sm tabular-nums">
        {totalTokens.toLocaleString()} tokens
      </div>
      <div className="text-muted-foreground text-xs tabular-nums">
        ~${cost.toFixed(6)}
      </div>
    </div>
  );
}

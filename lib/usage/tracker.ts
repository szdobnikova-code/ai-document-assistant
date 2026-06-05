import 'server-only';

import { costFor } from './pricing';
import type {
  UsageByModel,
  UsageKind,
  UsageSummary,
  UsageTotals,
} from './types';

function emptyTotals(): UsageTotals {
  return {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedUsdCost: 0,
  };
}

function emptyByModel(): UsageByModel {
  return {
    calls: 0,
    inputTokens: 0,
    outputTokens: 0,
    estimatedUsdCost: 0,
  };
}

let totals: UsageTotals = emptyTotals();
let byModel: Map<string, UsageByModel> = new Map();
let sessionStartedAt: number = Date.now();

export const usageTracker = {
  record(
    kind: UsageKind,
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): void {
    const cost = costFor(model, inputTokens, outputTokens);

    totals.inputTokens += inputTokens;
    totals.outputTokens += outputTokens;
    totals.totalTokens += inputTokens + outputTokens;
    totals.estimatedUsdCost += cost;

    const current = byModel.get(model) ?? emptyByModel();
    current.calls += 1;
    current.inputTokens += inputTokens;
    current.outputTokens += outputTokens;
    current.estimatedUsdCost += cost;
    byModel.set(model, current);

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[usage] ${kind} ${model} in=${inputTokens} out=${outputTokens} cost=$${cost.toFixed(6)}`,
      );
    }
  },

  getSummary(): UsageSummary {
    return {
      totals: { ...totals },
      byModel: Object.fromEntries(
        [...byModel.entries()].map(([k, v]) => [k, { ...v }]),
      ),
      sessionStartedAt,
    };
  },

  reset(): void {
    totals = emptyTotals();
    byModel = new Map();
    sessionStartedAt = Date.now();
  },
};

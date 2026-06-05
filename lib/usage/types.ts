export type UsageKind = 'embedding' | 'generation';

export interface UsageEvent {
  kind: UsageKind;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedUsdCost: number;
  at: number;
}

export interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedUsdCost: number;
}

export interface UsageByModel {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  estimatedUsdCost: number;
}

export interface UsageSummary {
  totals: UsageTotals;
  byModel: Record<string, UsageByModel>;
  sessionStartedAt: number;
}

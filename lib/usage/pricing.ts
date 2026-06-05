// USD per 1M tokens. Verify on https://openai.com/api/pricing — these are
// estimates and OpenAI changes pricing without notice.
export const MODEL_PRICING: Record<
  string,
  { inputPerMillion: number; outputPerMillion: number }
> = {
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'text-embedding-3-small': { inputPerMillion: 0.02, outputPerMillion: 0 },
};

export function costFor(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = MODEL_PRICING[model];
  if (!price) return 0;
  return (
    (inputTokens * price.inputPerMillion) / 1_000_000 +
    (outputTokens * price.outputPerMillion) / 1_000_000
  );
}

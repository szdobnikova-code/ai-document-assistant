export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) {
    throw new Error('cosineSimilarity: vectors must not be empty');
  }
  if (a.length !== b.length) {
    throw new Error(
      `cosineSimilarity: vectors must have equal length (got ${a.length} and ${b.length})`,
    );
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) {
    throw new Error('cosineSimilarity: vectors must have non-zero magnitude');
  }

  return dot / magnitude;
}

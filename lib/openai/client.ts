import 'server-only';
import OpenAI from 'openai';

let client: OpenAI | null = null;

// Single shared client reused for both embeddings and answer generation.
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required to call OpenAI.');
  }
  return (client ??= new OpenAI({ apiKey }));
}

import 'server-only';
import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it to your environment (.env.local) to generate embeddings.',
    );
  }
  return (client ??= new OpenAI({ apiKey }));
}

// Turns a single string into an embedding vector. Callers pass the result to
// the vector store — the store never sees raw text or OpenAI (see AGENTS.md).
export async function embedText(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    encoding_format: 'float',
  });

  const embedding = response.data[0]?.embedding;

  if (!embedding) {
    throw new Error('OpenAI returned no embedding');
  }

  return embedding;
}

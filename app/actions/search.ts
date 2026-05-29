'use server';

import { retrieveChunks } from '@/lib/retrieval/retrieve-chunks';

const TOP_K = 3;

// View shape sent to the client: text + score only, never the embedding vector
// (~1536 floats per chunk) — keep the server-action payload small.
export interface SearchResult {
  id: string;
  text: string;
  score: number;
  filename: string;
  index: number;
}

export type SearchState =
  | { status: 'idle' }
  | { status: 'success'; query: string; results: SearchResult[] }
  | { status: 'error'; message: string };

export async function searchChunks(
  query: string | FormData,
): Promise<SearchState> {
  const raw =
    typeof query === 'string' ? query : String(query.get('query') ?? '');
  const q = raw.trim();
  if (q.length === 0) {
    return { status: 'error', message: 'Enter a question to search.' };
  }

  try {
    const scored = await retrieveChunks(q, TOP_K);
    const results: SearchResult[] = scored.map(({ chunk, score }) => ({
      id: chunk.id,
      text: chunk.text,
      score,
      filename: chunk.meta.filename,
      index: chunk.meta.index,
    }));
    return { status: 'success', query: q, results };
  } catch (err) {
    // Log raw error server-side only; never surface it to the UI.
    console.error('Search failed:', err);
    return {
      status: 'error',
      message: 'Search failed. Make sure a document is uploaded and try again.',
    };
  }
}

import { encode, decode } from 'gpt-tokenizer';

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
}

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_OVERLAP = 50;

export function chunkText(
  text: string,
  options: ChunkOptions = {},
): TextChunk[] {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap || DEFAULT_OVERLAP;

  if (overlap >= chunkSize) {
    throw new Error('Overlap must be less than chunk size');
  }

  const tokens = encode(text);
  const chunks: TextChunk[] = [];

  let start = 0;
  let index = 0;
  while (start < tokens.length) {
    const end = start + chunkSize;
    const slice = tokens.slice(start, end);

    chunks.push({
      index,
      content: decode(slice),
      tokenCount: slice.length,
    });
    start += chunkSize - overlap;
    index++;
  }
  return chunks;
}

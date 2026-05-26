// Extraction output (Day 2 deliverable)
export interface DocumentMeta {
  id: string;
  filename: string;
  pageCount: number;
  charCount: number;
  createdAt: Date;
}

export interface ExtractedDocument {
  meta: DocumentMeta;
  text: string;
}

// Storage contract types (generic per SPEC VectorStore<T>)
export interface ChunkMeta {
  documentId: string;
  filename: string;
  index: number;
  page?: number;
}

export interface StoredChunk<T = ChunkMeta> {
  id: string;
  text: string;
  embedding?: number[]; // READY embedding — store never computes this
  meta: T;
}

export interface Scored<T = ChunkMeta> {
  chunk: StoredChunk<T>;
  score: number;
}

export interface SearchParams {
  embedding: number[]; // never raw text
  topK: number;
}

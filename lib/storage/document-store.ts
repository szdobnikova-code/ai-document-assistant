import 'server-only';

import { DocumentMeta, StoredChunk } from '@/types/document';
import { vectorStore } from '@/lib/storage/store';
import { getPostgresPool } from '@/lib/db/postgres';
import { getErrorMessage } from '@/lib/utils';

// Single-active-document lifecycle. Owning this here keeps the upload action
// backend-agnostic — it never branches on which vector store is in use.
export interface DocumentStore {
  replaceActive(meta: DocumentMeta, chunks: StoredChunk[]): Promise<void>;
}

class MemoryDocumentStore implements DocumentStore {
  async replaceActive(
    _meta: DocumentMeta,
    chunks: StoredChunk[],
  ): Promise<void> {
    await vectorStore.reset();
    await vectorStore.add(chunks);
  }
}

class PgDocumentStore implements DocumentStore {
  async replaceActive(
    meta: DocumentMeta,
    chunks: StoredChunk[],
  ): Promise<void> {
    const db = getPostgresPool();
    try {
      // FK cascade wipes document_chunks — no separate chunks delete needed.
      await db.query('delete from documents');
      await db.query(
        `
        insert into documents (
          id,
          filename,
          page_count,
          char_count,
          created_at
        )
        values ($1, $2, $3, $4, $5)
        `,
        [
          meta.id,
          meta.filename,
          meta.pageCount,
          meta.charCount,
          meta.createdAt,
        ],
      );
      await vectorStore.add(chunks);
    } catch (error) {
      throw new Error(
        `PgDocumentStore.replaceActive failed: ${getErrorMessage(error)}`,
      );
    }
  }
}

const usePgVector = process.env.VECTOR_STORE === 'pg';

export const documentStore: DocumentStore = usePgVector
  ? new PgDocumentStore()
  : new MemoryDocumentStore();

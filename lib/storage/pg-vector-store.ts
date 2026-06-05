import 'server-only';

import {
  ChunkMeta,
  type Scored,
  type SearchParams,
  type StoredChunk,
} from '@/types/document';
import { VectorStore } from './vector-store';
import { getPostgresPool } from '@/lib/db/postgres';
import { getErrorMessage } from '@/lib/utils';

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

export class PgVectorStore<
  T extends ChunkMeta = ChunkMeta,
> implements VectorStore<T> {
  async add(items: StoredChunk<T>[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const db = getPostgresPool();

    try {
      for (const item of items) {
        if (!item.embedding) {
          throw new Error(
            `PgVectorStore.add: chunk ${item.id} is missing embedding`,
          );
        }

        await db.query(
          `
          insert into document_chunks (
            id,
            document_id,
            filename,
            chunk_index,
            page,
            text,
            embedding,
            token_count
          )
          values ($1, $2, $3, $4, $5, $6, $7::vector, $8)
          on conflict (id) do update set
            filename = excluded.filename,
            chunk_index = excluded.chunk_index,
            page = excluded.page,
            text = excluded.text,
            embedding = excluded.embedding,
            token_count = excluded.token_count
          `,
          [
            item.id,
            item.meta.documentId,
            item.meta.filename,
            item.meta.index,
            item.meta.page ?? null,
            item.text,
            toVectorLiteral(item.embedding),
            item.tokenCount ?? null,
          ],
        );
      }
    } catch (error) {
      throw new Error(`PgVectorStore.add failed: ${getErrorMessage(error)}`);
    }
  }

  async search(params: SearchParams): Promise<Scored<T>[]> {
    const { embedding, topK } = params;

    if (topK <= 0) {
      throw new Error('PgVectorStore.search: topK must be > 0');
    }

    const db = getPostgresPool();

    try {
      const result = await db.query<{
        id: string;
        document_id: string;
        filename: string;
        chunk_index: number;
        page: number | null;
        text: string;
        token_count: number | null;
        score: number;
      }>(
        `
        select
          id,
          document_id,
          filename,
          chunk_index,
          page,
          text,
          token_count,
          1 - (embedding <=> $1::vector) as score
        from document_chunks
        order by embedding <=> $1::vector
        limit $2
        `,
        [toVectorLiteral(embedding), topK],
      );

      return result.rows.map((row) => ({
        chunk: {
          id: row.id,
          text: row.text,
          tokenCount: row.token_count ?? undefined,
          meta: {
            documentId: row.document_id,
            filename: row.filename,
            index: row.chunk_index,
            page: row.page ?? undefined,
          } as T,
        },
        score: row.score,
      }));
    } catch (error) {
      throw new Error(`PgVectorStore.search failed: ${getErrorMessage(error)}`);
    }
  }

  async reset(): Promise<void> {
    try {
      await getPostgresPool().query('delete from document_chunks');
    } catch (error) {
      throw new Error(`PgVectorStore.reset failed: ${getErrorMessage(error)}`);
    }
  }
}

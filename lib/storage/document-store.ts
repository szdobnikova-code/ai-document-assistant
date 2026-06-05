import { DocumentMeta } from '@/types/document';
import { getPostgresPool } from '@/lib/db/postgres';
import { getErrorMessage } from '@/lib/utils';

export async function upsertDocument(meta: DocumentMeta): Promise<void> {
  try {
    await getPostgresPool().query(
      `
      insert into documents (
        id,
        filename,
        page_count,
        char_count,
        created_at
      )
      values ($1, $2, $3, $4, $5)
      on conflict (id) do update set
        filename = excluded.filename,
        page_count = excluded.page_count,
        char_count = excluded.char_count,
        created_at = excluded.created_at
      `,
      [meta.id, meta.filename, meta.pageCount, meta.charCount, meta.createdAt],
    );
  } catch (error) {
    throw new Error(`upsertDocument failed: ${getErrorMessage(error)}`);
  }
}

'use server';

import { z } from 'zod';

import { chunkText } from '@/lib/chunk/chunk-text';
import { embedTexts } from '@/lib/embeddings/embed-text';
import { extractPdfText } from '@/lib/pdf/extract';
import { documentStore } from '@/lib/storage/document-store';
import type { ExtractedDocument, StoredChunk } from '@/types/document';

const fileSchema = z.file().mime('application/pdf');

export interface ChunkStats {
  chunksCount: number;
  totalTokens: number;
  avgTokens: number;
  maxTokens: number;
}

export interface EmbeddingStats {
  embeddedChunksCount: number;
  embeddingDimensions: number;
}

export type UploadState =
  | { status: 'idle' }
  | {
      status: 'success';
      document: ExtractedDocument;
      chunkStats: ChunkStats;
      embeddingStats?: EmbeddingStats;
    }
  | { status: 'error'; message: string };

export async function uploadDocument(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const parsed = fileSchema.safeParse(formData.get('file'));
  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Invalid file',
    };
  }

  try {
    const document = await extractPdfText(
      await parsed.data.arrayBuffer(),
      parsed.data.name,
    );
    if (document.text.trim().length === 0) {
      return {
        status: 'error',
        message: 'No extractable text found (PDF may be scanned/image-only).',
      };
    }
    const chunks = chunkText(document.text);
    const tokenCounts = chunks.map((c) => c.tokenCount);
    const totalTokens = tokenCounts.reduce((sum, n) => sum + n, 0);
    const chunkStats: ChunkStats = {
      chunksCount: chunks.length,
      totalTokens,
      avgTokens: Math.round(totalTokens / chunks.length),
      maxTokens: Math.max(...tokenCounts),
    };

    // Embedding is best-effort: a failure here (missing/invalid key, network,
    // empty response) must not drop the extraction + chunk stats above.
    let embeddingStats: EmbeddingStats | undefined;
    try {
      const embeddings = await embedTexts(chunks.map((c) => c.content));
      const stored: StoredChunk[] = chunks.map((chunk, i) => ({
        id: `${document.meta.id}-${chunk.index}`,
        text: chunk.content,
        embedding: embeddings[i],
        tokenCount: chunk.tokenCount,
        meta: {
          documentId: document.meta.id,
          filename: document.meta.filename,
          index: chunk.index,
        },
      }));
      await documentStore.replaceActive(document.meta, stored);
      const dims = stored[0]?.embedding?.length ?? 0;
      if (stored.length > 0 && dims > 0) {
        embeddingStats = {
          embeddedChunksCount: stored.length,
          embeddingDimensions: dims,
        };
      }
    } catch (err) {
      // Log server-side only; never surface raw OpenAI errors to the UI.
      console.error('Embedding step failed:', err);
    }

    return { status: 'success', document, chunkStats, embeddingStats };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to extract text',
    };
  }
}

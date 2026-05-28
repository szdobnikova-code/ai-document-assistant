import { extractText, getDocumentProxy } from 'unpdf';
import type { ExtractedDocument } from '@/types/document';

export async function extractPdfText(
  data: ArrayBuffer,
  filename: string,
): Promise<ExtractedDocument> {
  const pdf = await getDocumentProxy(new Uint8Array(data));

  const { text, totalPages } = await extractText(pdf, {
    mergePages: true,
  });

  return {
    meta: {
      id: crypto.randomUUID(),
      filename,
      pageCount: totalPages,
      charCount: text.length,
      createdAt: new Date(),
    },
    text,
  };
}

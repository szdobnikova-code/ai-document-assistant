import { extractText, getDocumentProxy } from 'unpdf';
import type { ExtractedDocument } from '@/types/document';
import { createHash } from 'node:crypto';

function createDeterministicUuid(data: ArrayBuffer): string {
  const hash = createHash('sha256').update(Buffer.from(data)).digest();

  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;

  const hex = hash.subarray(0, 16).toString('hex');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

export async function extractPdfText(
  data: ArrayBuffer,
  filename: string,
): Promise<ExtractedDocument> {
  const id = createDeterministicUuid(data);
  const pdf = await getDocumentProxy(new Uint8Array(data));

  const { text, totalPages } = await extractText(pdf, {
    mergePages: true,
  });

  return {
    meta: {
      id,
      filename,
      pageCount: totalPages,
      charCount: text.length,
      createdAt: new Date(),
    },
    text,
  };
}

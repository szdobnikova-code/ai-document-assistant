import { PDFParse } from 'pdf-parse';

import type { ExtractedDocument } from '@/types/document';

export async function extractPdfText(
  data: ArrayBuffer,
  filename: string,
): Promise<ExtractedDocument> {
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return {
      meta: {
        id: crypto.randomUUID(),
        filename,
        pageCount: result.total,
        charCount: result.text.length,
        createdAt: new Date(),
      },
      text: result.text,
    };
  } finally {
    await parser.destroy();
  }
}
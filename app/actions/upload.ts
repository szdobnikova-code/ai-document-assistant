'use server';

import { z } from 'zod';

import { extractPdfText } from '@/lib/pdf/extract';
import type { ExtractedDocument } from '@/types/document';

const fileSchema = z.file().mime('application/pdf');

export type UploadState =
  | { status: 'idle' }
  | { status: 'success'; document: ExtractedDocument }
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
    return { status: 'success', document };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to extract text',
    };
  }
}
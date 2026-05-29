'use server';

import { AnswerSource, generateAnswer } from '@/lib/ai/generate-answer';
import { retrieveChunks } from '@/lib/retrieval/retrieve-chunks';

const TOP_K = 3;
const MAX_QUESTION_LENGTH = 1000;

export type AnswerState =
  | { status: 'idle' }
  | {
      status: 'success';
      question: string;
      answer: string;
      sources: AnswerSource[];
    }
  | { status: 'error'; message: string };

export async function askQuestion(
  input: string | FormData,
): Promise<AnswerState> {
  const raw =
    typeof input === 'string' ? input : String(input.get('question') ?? '');
  const q = raw.trim();
  if (q.length === 0) {
    return { status: 'error', message: 'Enter a question to ask.' };
  }
  if (q.length > MAX_QUESTION_LENGTH) {
    return {
      status: 'error',
      message: 'Question is too long. Please keep it under 1000 characters.',
    };
  }

  try {
    const scored = await retrieveChunks(q, TOP_K);
    if (scored.length === 0) {
      return {
        status: 'success',
        question: q,
        answer: 'No document content is available — upload a PDF first.',
        sources: [],
      };
    }

    const sources: AnswerSource[] = scored.map(({ chunk, score }) => ({
      id: chunk.id,
      text: chunk.text,
      filename: chunk.meta.filename,
      index: chunk.meta.index,
      score,
    }));
    const answer = await generateAnswer(q, sources);
    return {
      status: 'success',
      question: q,
      answer,
      sources,
    };
  } catch (err) {
    // Log raw error server-side only; never surface it to the UI.
    console.error('Answer generation failed:', err);
    return {
      status: 'error',
      message:
        'Could not generate an answer. Make sure a document is uploaded and try again.',
    };
  }
}

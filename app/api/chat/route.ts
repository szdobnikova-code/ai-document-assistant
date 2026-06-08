import { retrieveChunks } from '@/lib/retrieval/retrieve-chunks';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import type { ChatUIMessage, ChunkSource } from '@/types/chat';
import { usageTracker } from '@/lib/usage/tracker';

const GENERATION_MODEL = 'gpt-4o-mini';
const TOP_K = 3;

const SYSTEM_PROMPT = [
  'You answer questions about a document using ONLY the provided context passages.',
  'Do not use outside knowledge and do not invent information.',
  'When using information from a passage, cite it with its passage number like [1] or [2].',
  'Every factual claim should be supported by a citation.',
  'If the answer is not contained in the context, reply exactly: "I couldn\'t find that in the document."',
  'Reply as plain prose only — no markdown, no asterisks, no headings, no bullet lists, no bold or italics. One or two short paragraphs.',
].join(' ');

type TextPart = {
  type: 'text';
  text: string;
};

type ChatMessage = {
  role?: unknown;
  content?: unknown;
  parts?: unknown;
};

type ChatRequestBody = {
  messages?: unknown;
};

function isChatMessage(value: unknown): value is ChatMessage {
  return typeof value === 'object' && value !== null;
}

function isTextPart(value: unknown): value is TextPart {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'text' &&
    'text' in value &&
    typeof value.text === 'string'
  );
}

function getTextFromMessage(message: ChatMessage | undefined): string {
  if (!message) {
    return '';
  }

  if (typeof message.content === 'string') {
    return message.content.trim();
  }

  if (!Array.isArray(message.parts)) {
    return '';
  }

  return message.parts
    .filter(isTextPart)
    .map((part) => part.text)
    .join('')
    .trim();
}

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequestBody;

  const messages = Array.isArray(body.messages)
    ? body.messages.filter(isChatMessage)
    : [];

  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user');

  const question = getTextFromMessage(lastUserMessage);

  if (!question) {
    return new Response('Missing question', { status: 400 });
  }

  const scored = await retrieveChunks(question, TOP_K);

  const stream = createUIMessageStream<ChatUIMessage>({
    execute: async ({ writer }) => {
      if (scored.length === 0) {
        const result = streamText({
          model: openai(GENERATION_MODEL),
          prompt: 'No document content is available — upload a PDF first.',
          onFinish: ({ usage }) => {
            usageTracker.record(
              'generation',
              GENERATION_MODEL,
              usage.inputTokens ?? 0,
              usage.outputTokens ?? 0,
            );
          },
        });
        writer.merge(result.toUIMessageStream());
        return;
      }

      const sources: ChunkSource[] = scored.map(({ chunk, score }) => ({
        id: chunk.id,
        text: chunk.text,
        filename: chunk.meta.filename,
        index: chunk.meta.index,
        score,
      }));

      const passages = scored
        .map(({ chunk }, index) => `[${index + 1}] ${chunk.text}`)
        .join('\n\n');

      const result = streamText({
        model: openai(GENERATION_MODEL),
        system: SYSTEM_PROMPT,
        prompt: `Context passages:\n\n${passages}\n\nQuestion: ${question}`,
        temperature: 0.2,
        maxOutputTokens: 500,
        onFinish: ({ usage }) => {
          usageTracker.record(
            'generation',
            GENERATION_MODEL,
            usage.inputTokens ?? 0,
            usage.outputTokens ?? 0,
          );
          writer.write({
            type: 'data-sources',
            id: 'sources',
            data: sources,
          });
        },
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}

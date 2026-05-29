import 'server-only';

import { getOpenAIClient } from '@/lib/openai/client';

const GENERATION_MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = [
  'You answer questions about a document using ONLY the provided context passages.',
  'Do not use outside knowledge and do not invent information.',
  'If the answer is not contained in the context, reply exactly: "I couldn\'t find that in the document."',
  'Answer in plain text, concisely.',
].join(' ');

// Pure generation: takes the question plus already-retrieved context passages
// and returns a plain-text answer. Knows nothing about retrieval or embeddings.
export async function generateAnswer(
  question: string,
  context: string[],
): Promise<string> {
  const passages = context.map((text, i) => `[${i + 1}] ${text}`).join('\n\n');

  const userMessage = `Context passages:\n\n${passages}\n\nQuestion: ${question}`;

  const response = await getOpenAIClient().chat.completions.create({
    model: GENERATION_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.2,
    max_completion_tokens: 500,
  });

  const answer = response.choices[0]?.message.content?.trim();

  if (!answer) {
    throw new Error('OpenAI returned no answer');
  }

  return answer;
}

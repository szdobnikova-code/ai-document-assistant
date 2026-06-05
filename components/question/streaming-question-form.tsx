'use client';

import { useChat } from '@ai-sdk/react';
import { useState, type SubmitEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDocumentChat } from '@/components/chat/chat-provider';
import type { ChatUIMessage, ChunkSource } from '@/types/chat';

const NOT_FOUND_SENTINEL = "I couldn't find that in the document.";

export function StreamingQuestionForm() {
  const [input, setInput] = useState('');
  const chat = useDocumentChat();
  const { messages, sendMessage, status, error } = useChat<ChatUIMessage>({
    chat,
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const text = input.trim();
    if (!text || isLoading) return;

    void sendMessage({ text });
    setInput('');
  };

  return (
    <div className={'flex w-full flex-col gap-4'}>
      <form onSubmit={handleSubmit} className={'flex w-full flex-col gap-2'}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'Ask question about document...'}
          aria-label="Question"
        />

        <button type="submit" disabled={isLoading} className="self-end">
          <Sparkles />
          {isLoading ? 'Thinking...' : 'Ask'}
        </button>

        {error && (
          <Card>
            <CardContent>
              <p className="text-destructive text-sm">
                Could not generate an answer. Make sure a document is uploaded
                and try again.
              </p>
            </CardContent>
          </Card>
        )}

        {messages.length > 0 && (
          <div className={'flex flex-col gap-4 text-left'}>
            {messages.map((message) => {
              const answerText = message.parts
                .filter((part) => part.type === 'text')
                .map((part) => part.text)
                .join(' ');

              const sourcesPart = message.parts.find(
                (part) => part.type === 'data-sources',
              );
              const sources: ChunkSource[] = sourcesPart
                ? sourcesPart.data
                : [];
              const showSources =
                message.role === 'assistant' &&
                sources.length > 0 &&
                answerText.trim() !== NOT_FOUND_SENTINEL;

              return (
                <div key={message.id} className="flex flex-col gap-3">
                  <Card>
                    <CardContent>
                      <p
                        className={
                          'text-muted-foreground mb-2 text-sm uppercase'
                        }
                      >
                        {message.role}
                      </p>

                      <p className={'text-sm whitespace-pre-wrap'}>
                        {answerText}
                      </p>
                    </CardContent>
                  </Card>

                  {showSources && (
                    <div className="flex flex-col gap-3">
                      <h3 className="text-sm font-medium">Sources</h3>

                      {sources.map((source, index) => (
                        <Card key={source.id}>
                          <CardContent>
                            <div className="text-muted-foreground mb-2 flex justify-between text-xs">
                              <span>
                                [{index + 1}] {source.filename} · chunk{' '}
                                {source.index}
                              </span>
                              <span>score {source.score.toFixed(3)}</span>
                            </div>

                            <p className="line-clamp-4 text-sm whitespace-pre-wrap">
                              {source.text}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </form>
    </div>
  );
}

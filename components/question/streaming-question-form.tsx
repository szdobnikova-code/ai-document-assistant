'use client';

import { useChat } from '@ai-sdk/react';
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DefaultChatTransport } from 'ai';

export function StreamingQuestionForm() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: 'api/chat' }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const text = input.trim();
    if (!text || isLoading) return;

    await sendMessage({ text });
    setInput('');
  };

  return (
    <div className={'flex w-full flex-col gap-4'}>
      <form
        onSubmit={(e) => handleSubmit(e)}
        className={'flex w-full flex-col gap-2'}
      >
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
            {messages.map((message) => (
              <Card key={message.id}>
                <CardContent>
                  <p className={'text-muted-foreground mb-2 text-sm uppercase'}>
                    {message.role}
                  </p>

                  <p className={'text-sm whitespace-pre-wrap'}>
                    {message.parts
                      .filter((part) => part.type === 'text')
                      .map((part) => part.text)
                      .join(' ')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}

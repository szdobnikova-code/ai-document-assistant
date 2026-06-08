'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';

import { useDocumentChat } from '@/components/chat/chat-provider';
import { ChatMessage } from '@/components/chat/chat-message';
import { ChatComposer } from '@/components/chat/chat-composer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ChatUIMessage, ChunkSource } from '@/types/chat';

const NOT_FOUND_SENTINEL = "I couldn't find that in the document.";

function extractText(message: ChatUIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join(' ');
}

function extractSources(message: ChatUIMessage): ChunkSource[] {
  const sourcesPart = message.parts.find(
    (part) => part.type === 'data-sources',
  );
  return sourcesPart ? sourcesPart.data : [];
}

export function ChatThread() {
  const [input, setInput] = useState('');
  const chat = useDocumentChat();
  const { messages, sendMessage, status, error } = useChat<ChatUIMessage>({
    chat,
  });
  const isLoading = status === 'submitted' || status === 'streaming';
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    void sendMessage({ text });
    setInput('');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
        {messages.map((message) => {
          const role = message.role === 'user' ? 'user' : 'assistant';
          const text = extractText(message);
          const sources =
            role === 'assistant' && text.trim() !== NOT_FOUND_SENTINEL
              ? extractSources(message)
              : [];
          return (
            <ChatMessage
              key={message.id}
              role={role}
              text={text}
              sources={sources}
            />
          );
        })}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Couldn’t generate an answer</AlertTitle>
            <AlertDescription>
              Make sure a document is uploaded and try again.
            </AlertDescription>
          </Alert>
        )}

        <div ref={endRef} />
      </div>

      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        disabled={isLoading}
      />
    </div>
  );
}

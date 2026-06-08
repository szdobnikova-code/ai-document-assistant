import { Sparkles, User } from 'lucide-react';

import { SourceList } from '@/components/chat/source-card';
import type { ChunkSource } from '@/types/chat';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  text: string;
  sources?: ChunkSource[];
}

export function ChatMessage({ role, text, sources = [] }: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex w-full flex-row-reverse gap-3">
        <div
          className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full"
          aria-hidden
        >
          <User className="size-4" />
        </div>
        <div className="bg-muted text-foreground max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-row gap-3">
      <div
        className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg"
        aria-hidden
      >
        <Sparkles className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
          {text || '…'}
        </p>
        {sources.length > 0 && <SourceList sources={sources} />}
      </div>
    </div>
  );
}

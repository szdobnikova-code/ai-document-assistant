'use client';

import { useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trySubmit = () => {
    if (disabled) return;
    const text = value.trim();
    if (!text) return;
    onSubmit();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    trySubmit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      trySubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
      <div className="bg-card focus-within:ring-primary/30 flex items-end gap-2 rounded-2xl border p-2 transition-shadow focus-within:ring-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your document..."
          aria-label="Question"
          rows={1}
          className="placeholder:text-muted-foreground field-sizing-content max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed outline-none"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={disabled || value.trim().length === 0}
        >
          <Send />
        </Button>
      </div>
      <p className="text-muted-foreground text-center text-xs">
        AI responses may not always be correct. Please verify important
        information.
      </p>
    </form>
  );
}

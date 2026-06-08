'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { ChunkSource } from '@/types/chat';

const PREVIEW_TOGGLE_THRESHOLD = 500;

interface SourceCardProps {
  source: ChunkSource;
  position: number;
}

export function SourceCard({ source, position }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = source.text.length > PREVIEW_TOGGLE_THRESHOLD;
  const isExpanded = canExpand && expanded;

  return (
    <div className="border-border/60 bg-card/50 flex flex-col gap-1 rounded-md border px-3 py-2">
      <p className="text-muted-foreground truncate text-xs">
        Source {position} · {source.filename} · Chunk {source.index}
      </p>
      <p
        className={cn(
          'text-foreground text-sm leading-relaxed whitespace-pre-wrap',
          !isExpanded && 'line-clamp-2',
        )}
      >
        {source.text}
      </p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          className={cn(
            'focus-visible:ring-ring/40 inline-flex items-center gap-1 self-end rounded-sm text-xs transition-colors focus:outline-none focus-visible:ring-1',
            isExpanded
              ? 'text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground underline-offset-2 hover:underline',
          )}
        >
          {isExpanded ? 'Hide' : 'View'}
          {isExpanded ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </button>
      )}
    </div>
  );
}

export function SourceList({ sources }: { sources: ChunkSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-muted-foreground text-xs font-medium">
        Sources ({sources.length})
      </p>
      <div className="flex flex-col gap-2">
        {sources.map((source, i) => (
          <SourceCard key={source.id} source={source} position={i + 1} />
        ))}
      </div>
    </div>
  );
}

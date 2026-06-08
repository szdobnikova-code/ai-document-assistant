import { FileText } from 'lucide-react';

import type { ChunkSource } from '@/types/chat';

export function SourceCard({ source }: { source: ChunkSource }) {
  return (
    <div className="hover:bg-muted/50 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors">
      <div className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded">
        <FileText className="size-3" />
      </div>
      <span className="text-foreground truncate text-sm">
        {source.filename}
      </span>
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
      <div className="flex flex-col gap-0.5">
        {sources.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>
    </div>
  );
}

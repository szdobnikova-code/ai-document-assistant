'use client';

import { useEffect, useState } from 'react';
import { FileText, BookOpen, Hash, Upload } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import { useCurrentDocument } from '@/lib/upload/use-current-document';
import { relativeTimeFromNow } from '@/lib/utils/relative-time';
import { Button } from '@/components/ui/button';
import { REQUEST_REPLACE_DOCUMENT_EVENT } from '@/components/upload/upload-dropzone';
import { cn } from '@/lib/utils';

interface Stat {
  label: string;
  value: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

function useLiveRelativeTime(value: Date | string | number | undefined) {
  const [, force] = useState(0);
  useEffect(() => {
    if (value == null) return;
    const id = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [value]);
  if (value == null) return '';
  return relativeTimeFromNow(value);
}

export function CurrentDocumentCard({
  variant = 'default',
  showReplace = false,
  withHeading = false,
}: {
  variant?: 'default' | 'compact' | 'strip';
  showReplace?: boolean;
  withHeading?: boolean;
}) {
  const state = useCurrentDocument();
  const uploadedAgo = useLiveRelativeTime(
    state.status === 'success' ? state.document.meta.createdAt : undefined,
  );

  if (state.status !== 'success') return null;

  const { document, chunkStats } = state;
  const stats: Stat[] = [
    {
      label: 'Pages',
      value: document.meta.pageCount.toLocaleString(),
      icon: BookOpen,
    },
    {
      label: 'Tokens',
      value: chunkStats.totalTokens.toLocaleString(),
      icon: Hash,
    },
  ];

  const heading = withHeading ? (
    <h2 className="text-sm font-medium">Current Document</h2>
  ) : null;

  if (variant === 'strip') {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <FileText className="size-4 shrink-0" />
        <span className="text-foreground truncate text-sm font-medium">
          {document.meta.filename}
        </span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden truncate tabular-nums sm:inline">
          {document.meta.pageCount} pages ·{' '}
          {chunkStats.totalTokens.toLocaleString()} tokens
        </span>
        <ProcessedBadge className="ml-auto" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <section className="space-y-3">
        {heading}
        <div className="bg-card ring-foreground/10 flex items-start gap-3 rounded-xl px-3 py-2.5 ring-1">
          <div className="bg-destructive/10 text-destructive flex size-9 shrink-0 items-center justify-center rounded-md">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-muted-foreground text-[11px] leading-none font-medium">
              Current Document
            </p>
            <p className="truncate text-sm font-medium">
              {document.meta.filename}
            </p>
            <p className="text-muted-foreground text-xs">
              {document.meta.pageCount} pages ·{' '}
              {chunkStats.totalTokens.toLocaleString()} tokens
            </p>
          </div>
          <ProcessedBadge className="mt-0.5" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {heading}
      <div className="bg-card ring-foreground/10 flex flex-col gap-4 rounded-xl p-4 ring-1">
        <div className="flex items-start gap-3">
          <div className="bg-destructive/10 text-destructive flex size-10 shrink-0 items-center justify-center rounded-md">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">
                {document.meta.filename}
              </p>
              <ProcessedBadge />
            </div>
            {uploadedAgo && (
              <p className="text-muted-foreground text-xs">
                Uploaded {uploadedAgo}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <StatTile key={stat.label} {...stat} />
          ))}
        </div>

        {showReplace && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() =>
              window.dispatchEvent(new Event(REQUEST_REPLACE_DOCUMENT_EVENT))
            }
          >
            <Upload />
            Replace document
          </Button>
        )}
      </div>
    </section>
  );
}

function StatTile({ label, value, icon: Icon }: Stat) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

function ProcessedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400',
        className,
      )}
    >
      Processed
    </span>
  );
}

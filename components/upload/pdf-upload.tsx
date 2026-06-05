'use client';

import { useActionState, useEffect, useSyncExternalStore } from 'react';
import { FileUp } from 'lucide-react';

import { uploadDocument, type UploadState } from '@/app/actions/upload';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialState: UploadState = { status: 'idle' };
const STORAGE_KEY = 'ai-document-assistant:upload-state';

let cachedRaw: string | null = null;
let cachedValue: UploadState = initialState;

function getStoredSnapshot(): UploadState {
  if (typeof window === 'undefined') {
    return initialState;
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);

  if (raw === cachedRaw) {
    return cachedValue;
  }

  cachedRaw = raw;

  if (!raw) {
    cachedValue = initialState;
    return cachedValue;
  }

  try {
    cachedValue = JSON.parse(raw) as UploadState;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    cachedRaw = null;
    cachedValue = initialState;
  }

  return cachedValue;
}

function getServerSnapshot(): UploadState {
  return initialState;
}

function subscribeToStoredState(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function PdfUpload() {
  const [state, action, pending] = useActionState(uploadDocument, initialState);
  const storedState = useSyncExternalStore(
    subscribeToStoredState,
    getStoredSnapshot,
    getServerSnapshot,
  );

  const displayState = state.status === 'idle' ? storedState : state;

  useEffect(() => {
    if (state.status === 'success') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  return (
    <div className="flex w-full flex-col gap-4">
      <form action={action} className="flex flex-col items-center gap-3">
        <input
          type="file"
          name="file"
          accept="application/pdf"
          required
          className="text-muted-foreground file:border-input file:bg-background hover:file:bg-muted block w-full text-sm file:mr-3 file:rounded-lg file:border file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        <Button type="submit" disabled={pending}>
          <FileUp />
          {pending ? 'Extracting…' : 'Extract text'}
        </Button>
      </form>

      {displayState.status === 'error' && (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t extract text</AlertTitle>
          <AlertDescription>{displayState.message}</AlertDescription>
        </Alert>
      )}

      {displayState.status === 'success' && (
        <>
          <Card className="text-left">
            <CardHeader>
              <CardTitle>{displayState.document.meta.filename}</CardTitle>
              <CardDescription>
                {displayState.document.meta.pageCount} pages ·{' '}
                {displayState.document.meta.charCount.toLocaleString()}{' '}
                characters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3 text-sm">
                {displayState.chunkStats.chunksCount} chunks · avg{' '}
                {displayState.chunkStats.avgTokens} tokens · max{' '}
                {displayState.chunkStats.maxTokens} tokens
              </p>
              <p className="text-muted-foreground mb-3 text-sm">
                {displayState.embeddingStats
                  ? `${displayState.embeddingStats.embeddedChunksCount} chunks embedded · ${displayState.embeddingStats.embeddingDimensions} dimensions`
                  : 'Embeddings unavailable'}
              </p>
              <pre className="bg-muted max-h-80 overflow-auto rounded-lg p-3 text-xs whitespace-pre-wrap">
                {displayState.document.text}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

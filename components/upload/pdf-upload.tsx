'use client';

import { useActionState } from 'react';
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
import { ChunkSearch } from '../search/chunk-search';

const initialState: UploadState = { status: 'idle' };

export function PdfUpload() {
  const [state, action, pending] = useActionState(uploadDocument, initialState);

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

      {state.status === 'error' && (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t extract text</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.status === 'success' && (
        <>
          <Card className="text-left">
            <CardHeader>
              <CardTitle>{state.document.meta.filename}</CardTitle>
              <CardDescription>
                {state.document.meta.pageCount} pages ·{' '}
                {state.document.meta.charCount.toLocaleString()} characters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3 text-sm">
                {state.chunkStats.chunksCount} chunks · avg{' '}
                {state.chunkStats.avgTokens} tokens · max{' '}
                {state.chunkStats.maxTokens} tokens
              </p>
              <p className="text-muted-foreground mb-3 text-sm">
                {state.embeddingStats
                  ? `${state.embeddingStats.embeddedChunksCount} chunks embedded · ${state.embeddingStats.embeddingDimensions} dimensions`
                  : 'Embeddings unavailable'}
              </p>
              <pre className="bg-muted max-h-80 overflow-auto rounded-lg p-3 text-xs whitespace-pre-wrap">
                {state.document.text}
              </pre>
            </CardContent>
          </Card>
          <div className="mt-6">
            <ChunkSearch key={state.document.meta.id} />
          </div>
        </>
      )}
    </div>
  );
}

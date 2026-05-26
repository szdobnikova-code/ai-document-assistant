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
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted"
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
        <Card className="text-left">
          <CardHeader>
            <CardTitle>{state.document.meta.filename}</CardTitle>
            <CardDescription>
              {state.document.meta.pageCount} pages ·{' '}
              {state.document.meta.charCount.toLocaleString()} characters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
              {state.document.text}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
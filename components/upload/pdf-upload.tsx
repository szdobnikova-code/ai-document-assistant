'use client';

import {
  useActionState,
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from 'react';
import { FileUp } from 'lucide-react';

import { uploadDocument, type UploadState } from '@/app/actions/upload';
import { useClearDocumentChat } from '@/components/chat/chat-provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const clearChat = useClearDocumentChat();

  const displayState = state.status === 'idle' ? storedState : state;
  const hasExistingDocument = displayState.status === 'success';

  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const pendingFilename =
    (pendingFormData?.get('file') as File | null)?.name ?? null;

  useEffect(() => {
    if (state.status === 'success') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      clearChat();
    }
  }, [state, clearChat]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!hasExistingDocument) return;
    e.preventDefault();
    setPendingFormData(new FormData(e.currentTarget));
  };

  const handleConfirmReplace = () => {
    if (pendingFormData) {
      action(pendingFormData);
      setPendingFormData(null);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) setPendingFormData(null);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <form
        action={action}
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-3"
      >
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

      <AlertDialog
        open={pendingFormData !== null}
        onOpenChange={handleDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace current document?</AlertDialogTitle>
            <AlertDialogDescription>
              {displayState.status === 'success' && (
                <>
                  Uploading{' '}
                  <strong>{pendingFilename ?? 'a new document'}</strong> will
                  replace <strong>{displayState.document.meta.filename}</strong>{' '}
                  and clear the current chat.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace}>
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

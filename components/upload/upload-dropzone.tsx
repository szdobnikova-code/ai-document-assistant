'use client';

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';

import { uploadDocument, type UploadState } from '@/app/actions/upload';
import { useClearDocumentChat } from '@/components/chat/chat-provider';
import {
  useCurrentDocument,
  writeCurrentDocument,
} from '@/lib/upload/use-current-document';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

const initialState: UploadState = { status: 'idle' };

export const REQUEST_REPLACE_DOCUMENT_EVENT = 'request-replace-document';

function buildFormData(file: File): FormData {
  const data = new FormData();
  data.append('file', file);
  return data;
}

export function UploadDropzone() {
  const [actionState, action, pending] = useActionState(
    uploadDocument,
    initialState,
  );
  const storedState = useCurrentDocument();
  const clearChat = useClearDocumentChat();

  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasExistingDocument = storedState.status === 'success';
  const existingFilename =
    storedState.status === 'success'
      ? storedState.document.meta.filename
      : null;

  useEffect(() => {
    if (actionState.status === 'success') {
      writeCurrentDocument(actionState);
      clearChat();
    }
  }, [actionState, clearChat]);

  const submitFile = useCallback(
    (file: File) => {
      startTransition(() => action(buildFormData(file)));
    },
    [action],
  );

  const handleFiles = useCallback(
    (files: FileList | File[] | null | undefined) => {
      const file = files && files[0];
      if (!file) return;
      if (hasExistingDocument) {
        setPendingFile(file);
      } else {
        submitFile(file);
      }
    },
    [hasExistingDocument, submitFile],
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  useEffect(() => {
    const onRequest = () => openFilePicker();
    window.addEventListener(REQUEST_REPLACE_DOCUMENT_EVENT, onRequest);
    return () =>
      window.removeEventListener(REQUEST_REPLACE_DOCUMENT_EVENT, onRequest);
  }, [openFilePicker]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleConfirmReplace = () => {
    if (pendingFile) {
      submitFile(pendingFile);
      setPendingFile(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
          }
        }}
        className={cn(
          'border-border bg-card hover:border-primary/40 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragging && 'border-primary bg-primary/5',
          pending && 'pointer-events-none opacity-70',
        )}
      >
        <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
          {pending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <UploadCloud className="size-5" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {pending ? 'Extracting…' : 'Drag & drop your PDF here'}
          </p>
          {!pending && <p className="text-muted-foreground text-xs">or</p>}
        </div>
        {!pending && (
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
          >
            Choose PDF file
          </Button>
        )}
        <p className="text-muted-foreground text-xs">
          Only PDF files · Max 20MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={handleInputChange}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        Uploading a new document will replace the current document and start a
        new conversation.
      </p>

      {actionState.status === 'error' && (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t extract text</AlertTitle>
          <AlertDescription>{actionState.message}</AlertDescription>
        </Alert>
      )}

      <AlertDialog
        open={pendingFile !== null}
        onOpenChange={(open) => {
          if (!open) setPendingFile(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace current document?</AlertDialogTitle>
            <AlertDialogDescription>
              Uploading <strong>{pendingFile?.name ?? 'a new document'}</strong>{' '}
              will replace <strong>{existingFilename}</strong> and clear the
              current chat.
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
    </div>
  );
}

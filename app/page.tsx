import { UploadDropzone } from '@/components/upload/upload-dropzone';
import { CurrentDocumentCard } from '@/components/upload/current-document-card';

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Upload Document
        </h1>
        <p className="text-muted-foreground text-sm">
          Upload a PDF document to start asking questions
        </p>
      </header>

      <UploadDropzone />

      <CurrentDocumentCard withHeading showReplace />
    </div>
  );
}

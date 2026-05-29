import { FileUp } from 'lucide-react';

import { PdfUpload } from '@/components/upload/pdf-upload';

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
      <section className="flex w-full max-w-xl flex-col items-center text-center">
        <div className="mb-6 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <FileUp className="h-10 w-10 text-zinc-500" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">
          AI Document Assistant
        </h1>

        <p className="mt-3 text-balance text-zinc-600 dark:text-zinc-400">
          Upload a PDF, ask questions, and get cited answers powered by RAG.
        </p>

        <div className="mt-6 w-full">
          <PdfUpload />
        </div>
      </section>
    </main>
  );
}

import { StreamingQuestionForm } from '@/components/question/streaming-question-form';

export default function EvalPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] justify-center px-6 py-12">
      <section className="w-full max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight">Evaluation</h1>

        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Ask questions against the uploaded document and inspect the generated
          answer with sources.
        </p>

        <div className="mt-8">
          <StreamingQuestionForm />
        </div>
      </section>
    </main>
  );
}

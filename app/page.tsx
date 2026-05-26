import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";

export default function HomePage() {
    return (
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
            <section className="flex max-w-xl flex-col items-center text-center">
                <div className="mb-6 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
                    <FileUp className="h-10 w-10 text-zinc-500" />
                </div>

                <h1 className="text-3xl font-semibold tracking-tight">
                    AI Document Assistant
                </h1>

                <p className="mt-3 text-balance text-zinc-600 dark:text-zinc-400">
                    Upload a PDF, ask questions, and get cited answers powered by RAG.
                </p>

                <Button className="mt-6">Upload PDF</Button>
            </section>
        </main>
    );
}

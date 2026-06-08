import { CurrentDocumentCard } from '@/components/upload/current-document-card';
import { ChatThread } from '@/components/chat/chat-thread';

export default function AssistantPage() {
  return (
    <div className="flex h-[calc(100svh-3.5rem)] w-full flex-col px-4 py-5 sm:px-8 md:h-svh md:py-6 lg:px-10">
      <div className="border-border space-y-3 border-b pb-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            AI Document Assistant
          </h1>
          <p className="text-muted-foreground text-sm">
            Ask questions about your document
          </p>
        </header>
        <CurrentDocumentCard variant="strip" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col pt-4">
        <ChatThread />
      </div>
    </div>
  );
}

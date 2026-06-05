import type { UIMessage } from 'ai';

export interface ChunkSource {
  id: string;
  text: string;
  filename: string;
  index: number;
  score: number;
}

export type ChatUIMessage = UIMessage<never, { sources: ChunkSource[] }>;

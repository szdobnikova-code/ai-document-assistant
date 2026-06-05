'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { Chat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { ChatUIMessage } from '@/types/chat';

const ChatContext = createContext<Chat<ChatUIMessage> | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chat] = useState(
    () =>
      new Chat<ChatUIMessage>({
        transport: new DefaultChatTransport({ api: '/api/chat' }),
      }),
  );

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useDocumentChat(): Chat<ChatUIMessage> {
  const chat = useContext(ChatContext);
  if (!chat) {
    throw new Error('useDocumentChat must be used within a ChatProvider');
  }
  return chat;
}

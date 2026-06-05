'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { Chat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { ChatUIMessage } from '@/types/chat';

interface ChatContextValue {
  chat: Chat<ChatUIMessage>;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function createChat() {
  return new Chat<ChatUIMessage>({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chat, setChat] = useState(createChat);
  const clearChat = useCallback(() => setChat(createChat()), []);

  return (
    <ChatContext.Provider value={{ chat, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
}

function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useDocumentChat must be used within a ChatProvider');
  }
  return ctx;
}

export function useDocumentChat(): Chat<ChatUIMessage> {
  return useChatContext().chat;
}

export function useClearDocumentChat(): () => void {
  return useChatContext().clearChat;
}

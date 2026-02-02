'use client';

import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChats } from '../hooks/useChats';
import { ChatListItem } from './ChatListItem';
import type { Chat } from '../types/chat.types';

interface ChatListProps {
  selectedChatId?: string;
  onSelectChat: (chat: Chat) => void;
}

export const ChatList = ({ selectedChatId, onSelectChat }: ChatListProps) => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useChats({ limit: 50 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        {t('chat.load_error', 'Failed to load chats')}
      </div>
    );
  }

  const chats = data?.items || [];

  if (chats.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        {t('chat.empty_list', 'No conversations yet')}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isSelected={chat.id === selectedChatId}
          onClick={() => onSelectChat(chat)}
        />
      ))}
    </div>
  );
};

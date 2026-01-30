'use client';

import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import type { Chat } from '../types/chat.types';

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

export const ChatListItem = ({ chat, isSelected, onClick }: ChatListItemProps) => {
  const { user } = useAppSelector((state) => state.auth);

  // For direct chats, show the other participant's name
  const getChatName = () => {
    if (chat.type === 'GROUP') {
      return chat.name || 'Group Chat';
    }
    const otherParticipant = chat.participants.find(
      (p) => p.userId !== user?.id
    );
    if (otherParticipant) {
      return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
    }
    return 'Chat';
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const unreadCount = chat.unreadCount || 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors',
        isSelected && 'bg-muted'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{getChatName()}</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {chat.lastMessage && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {chat.lastMessage.senderId === user?.id ? 'You: ' : ''}
              {chat.lastMessage.content}
            </p>
          )}
        </div>
        {chat.lastMessage && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTime(chat.lastMessage.createdAt)}
          </span>
        )}
      </div>
    </button>
  );
};

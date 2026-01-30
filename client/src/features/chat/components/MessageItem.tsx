'use client';

import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import type { ChatMessage } from '../types/chat.types';

interface MessageItemProps {
  message: ChatMessage;
}

export const MessageItem = ({ message }: MessageItemProps) => {
  const { user } = useAppSelector((state) => state.auth);
  const isOwnMessage = message.senderId === user?.id;

  // Check if message was read by anyone other than the sender
  const isRead = message.readBy && message.readBy.some((id) => id !== message.senderId);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'flex mb-3',
        isOwnMessage ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-3 py-2',
          isOwnMessage
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {!isOwnMessage && (
          <p className="text-xs font-medium mb-1 opacity-80">
            {message.sender.firstName} {message.sender.lastName}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-1',
            isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          <span className="text-xs">{formatTime(message.createdAt)}</span>
          {isOwnMessage && (
            isRead ? (
              <CheckCheck className="h-3.5 w-3.5 text-sky-300" aria-label="Read" />
            ) : (
              <Check className="h-3.5 w-3.5" aria-label="Sent" />
            )
          )}
        </div>
      </div>
    </div>
  );
};

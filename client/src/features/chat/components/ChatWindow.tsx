'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMessages, useSendMessage, useMarkAsRead, chatKeys } from '../hooks/useChats';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { useAppSelector } from '@/store/hooks';
import type { Chat, ChatsResponse } from '../types/chat.types';

interface ChatWindowProps {
  chat: Chat;
}

export const ChatWindow = ({ chat }: ChatWindowProps) => {
  const { user } = useAppSelector((state) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMarkedReadRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useMessages(chat.id, { limit: 100 });
  const sendMessage = useSendMessage(chat.id);
  const markAsRead = useMarkAsRead(chat.id);
  const {
    typingUsers,
    realtimeMessages,
    clearRealtimeMessages,
    sendTyping,
    sendStopTyping
  } = useChatWebSocket(chat.id);

  // Get other participant's name for direct chats
  const getChatTitle = () => {
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

  // Clear unread count in local cache immediately when viewing chat
  const clearUnreadCount = useCallback(() => {
    queryClient.setQueriesData<ChatsResponse>(
      { queryKey: chatKeys.lists() },
      (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((c) => {
            if (c.id === chat.id) {
              return { ...c, unreadCount: 0 };
            }
            return c;
          }),
        };
      }
    );
  }, [queryClient, chat.id]);

  // Combine fetched messages with realtime messages from WebSocket
  const messages = useMemo(() => {
    // API returns newest first, so reverse to get oldest first for display
    const fetchedMessages = [...(data?.items || [])].reverse();
    const fetchedIds = new Set(fetchedMessages.map((m) => m.id));

    // Add any realtime messages that aren't in the fetched data yet
    const newRealtimeMessages = realtimeMessages.filter(
      (m) => !fetchedIds.has(m.id)
    );

    // If all realtime messages are now in fetched data, clear them
    if (realtimeMessages.length > 0 && newRealtimeMessages.length === 0) {
      // Use setTimeout to avoid state update during render
      setTimeout(clearRealtimeMessages, 0);
    }

    return [...fetchedMessages, ...newRealtimeMessages];
  }, [data?.items, realtimeMessages, clearRealtimeMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Mark messages as read when opening chat or when chat changes
  useEffect(() => {
    if (chat.id && hasMarkedReadRef.current !== chat.id) {
      hasMarkedReadRef.current = chat.id;
      clearUnreadCount();
      markAsRead.mutate({});
    }
  }, [chat.id, clearUnreadCount, markAsRead]);

  // Mark as read when new realtime messages arrive while viewing
  useEffect(() => {
    if (realtimeMessages.length > 0) {
      const hasNewFromOthers = realtimeMessages.some(
        (m) => m.senderId !== user?.id
      );
      if (hasNewFromOthers) {
        markAsRead.mutate({});
        clearUnreadCount();
      }
    }
  }, [realtimeMessages, user?.id, markAsRead, clearUnreadCount]);

  const handleSend = (content: string) => {
    sendMessage.mutate({ content });
  };

  // Filter out current user from typing users
  const otherTypingUsers = typingUsers.filter((u) => u.userId !== user?.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold">{getChatTitle()}</h2>
        {chat.type === 'DIRECT' && (
          <p className="text-xs text-muted-foreground">
            {chat.participants.length} participants
          </p>
        )}
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive text-center">
            Failed to load messages
          </div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
          </>
        )}

        {/* Typing indicator */}
        {otherTypingUsers.length > 0 && (
          <div className="text-sm text-muted-foreground italic">
            {otherTypingUsers.map((u) => u.userName).join(', ')}{' '}
            {otherTypingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={sendTyping}
        onStopTyping={sendStopTyping}
        isSending={sendMessage.isPending}
      />
    </div>
  );
};

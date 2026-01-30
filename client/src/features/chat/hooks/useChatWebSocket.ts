'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAppSelector } from '@/store/hooks';
import {
  MessageType,
  type ChatMessagePayload,
  type ChatTypingPayload,
  type ChatReadPayload,
} from '@/lib/websocket/websocket.types';
import { chatKeys } from './useChats';
import type { ChatMessage, ChatsResponse, MessagesResponse } from '../types/chat.types';

interface TypingUser {
  userId: string;
  userName: string;
}

export const useChatWebSocket = (chatId?: string) => {
  const { subscribe, send, status } = useWebSocket();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
  const { user } = useAppSelector((state) => state.auth);
  const processedMessagesRef = useRef<Set<string>>(new Set());

  // Clear realtime messages when chat changes
  useEffect(() => {
    setRealtimeMessages([]);
    processedMessagesRef.current.clear();
  }, [chatId]);

  // Handle incoming chat message
  useEffect(() => {
    const unsubscribe = subscribe(MessageType.CHAT_MESSAGE, (wsMessage) => {
      const payload = wsMessage.payload as ChatMessagePayload;
      const incomingMessage = payload.message;

      // Skip if we've already processed this message
      if (processedMessagesRef.current.has(incomingMessage.id)) {
        return;
      }
      processedMessagesRef.current.add(incomingMessage.id);

      // For own messages, check if already in cache (mutation may have added it)
      // If not in cache yet, let it through so it gets added
      if (incomingMessage.senderId === user?.id) {
        const cachedMessages = queryClient.getQueryData<MessagesResponse>(
          chatKeys.messages(incomingMessage.chatId)
        );
        const alreadyInCache = cachedMessages?.items.some(
          (m) => m.id === incomingMessage.id
        );
        if (alreadyInCache) {
          return;
        }
      }

      // If we're viewing this chat, add the message directly to cache for immediate display
      if (chatId && incomingMessage.chatId === chatId) {
        // Add message directly to React Query cache (same pattern as useSendMessage)
        queryClient.setQueriesData<MessagesResponse>(
          { queryKey: chatKeys.messages(chatId) },
          (oldData) => {
            if (!oldData) return oldData;

            // Check if message already exists
            const exists = oldData.items.some((m) => m.id === incomingMessage.id);
            if (exists) return oldData;

            // Add new message to the beginning (messages are newest first in API response)
            return {
              ...oldData,
              items: [incomingMessage as ChatMessage, ...oldData.items],
              pagination: {
                ...oldData.pagination,
                totalItems: oldData.pagination.totalItems + 1,
              },
            };
          }
        );

        // Also add to realtime messages as a fallback for immediate display
        setRealtimeMessages((prev) => {
          // Check if already exists
          if (prev.some((m) => m.id === incomingMessage.id)) {
            return prev;
          }
          return [...prev, incomingMessage as ChatMessage];
        });
      }

      // Update chat list to show latest message and increment unread count
      queryClient.setQueriesData<ChatsResponse>(
        { queryKey: chatKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            items: oldData.items.map((chat) => {
              if (chat.id === incomingMessage.chatId) {
                const isCurrentChat = chatId === chat.id;
                return {
                  ...chat,
                  lastMessage: incomingMessage as ChatMessage,
                  unreadCount: isCurrentChat
                    ? chat.unreadCount || 0
                    : (chat.unreadCount || 0) + 1,
                  updatedAt: incomingMessage.createdAt,
                };
              }
              return chat;
            }),
          };
        }
      );
    });

    return unsubscribe;
  }, [subscribe, queryClient, chatId, user?.id]);

  // Handle typing indicators
  useEffect(() => {
    const unsubscribeTyping = subscribe(MessageType.CHAT_TYPING, (message) => {
      const payload = message.payload as ChatTypingPayload;

      if (payload.userId === user?.id) {
        return;
      }

      if (chatId && payload.chatId === chatId) {
        setTypingUsers((prev) => {
          const exists = prev.some((u) => u.userId === payload.userId);
          if (exists) return prev;
          return [...prev, { userId: payload.userId, userName: payload.userName }];
        });
      }
    });

    const unsubscribeStopTyping = subscribe(
      MessageType.CHAT_STOP_TYPING,
      (message) => {
        const payload = message.payload as { chatId: string; userId: string };

        if (chatId && payload.chatId === chatId) {
          setTypingUsers((prev) =>
            prev.filter((u) => u.userId !== payload.userId)
          );
        }
      }
    );

    return () => {
      unsubscribeTyping();
      unsubscribeStopTyping();
    };
  }, [subscribe, chatId, user?.id]);

  // Handle read receipts
  useEffect(() => {
    const unsubscribe = subscribe(MessageType.CHAT_READ, (message) => {
      const payload = message.payload as ChatReadPayload;

      // When another user reads messages in a chat I'm viewing,
      // update readBy arrays for MY sent messages (I want to see they read my messages)
      if (payload.userId !== user?.id && payload.chatId === chatId) {
        queryClient.setQueriesData<MessagesResponse>(
          { queryKey: chatKeys.messages(payload.chatId) },
          (oldData) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              items: oldData.items.map((msg) => {
                // Only update readBy for messages I sent (I need to see read status)
                // and only if the reader isn't already in readBy
                if (msg.senderId === user?.id && !msg.readBy.includes(payload.userId)) {
                  return {
                    ...msg,
                    readBy: [...msg.readBy, payload.userId],
                  };
                }
                return msg;
              }),
            };
          }
        );
      }

      // When I read messages, clear my unread count (original behavior)
      if (payload.userId === user?.id) {
        queryClient.setQueriesData<ChatsResponse>(
          { queryKey: chatKeys.lists() },
          (oldData) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              items: oldData.items.map((chat) => {
                if (chat.id === payload.chatId) {
                  return { ...chat, unreadCount: 0 };
                }
                return chat;
              }),
            };
          }
        );
      }
    });

    return unsubscribe;
  }, [subscribe, queryClient, user?.id, chatId]);

  // Send typing indicator
  const sendTyping = useCallback(() => {
    if (chatId && status === 'connected') {
      send({
        type: MessageType.CHAT_TYPING,
        payload: { chatId },
      });
    }
  }, [chatId, send, status]);

  // Send stop typing indicator
  const sendStopTyping = useCallback(() => {
    if (chatId && status === 'connected') {
      send({
        type: MessageType.CHAT_STOP_TYPING,
        payload: { chatId },
      });
    }
  }, [chatId, send, status]);

  // Clear realtime messages (called after data refetch includes them)
  const clearRealtimeMessages = useCallback(() => {
    setRealtimeMessages([]);
  }, []);

  return {
    typingUsers,
    realtimeMessages,
    clearRealtimeMessages,
    sendTyping,
    sendStopTyping,
    isConnected: status === 'connected',
  };
};

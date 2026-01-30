import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chat.service';
import type {
  ChatFilters,
  MessagesFilters,
  CreateDirectChatInput,
  SendMessageInput,
  MarkAsReadInput,
  MessagesResponse,
  ChatsResponse,
  ChatMessage,
} from '../types/chat.types';

// Query keys
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (filters: ChatFilters) => [...chatKeys.lists(), filters] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
  messages: (chatId: string) => [...chatKeys.all, 'messages', chatId] as const,
  messageList: (chatId: string, filters: MessagesFilters) =>
    [...chatKeys.messages(chatId), filters] as const,
};

// Get all chats (inbox)
export const useChats = (
  filters: ChatFilters = {},
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: chatKeys.list(filters),
    queryFn: () => chatService.getMyChats(filters),
    staleTime: 0, // Always consider data stale for real-time chat
    refetchOnWindowFocus: true,
    enabled: options?.enabled,
  });
};

// Get single chat by ID
export const useChat = (chatId: string | null) => {
  return useQuery({
    queryKey: chatKeys.detail(chatId || ''),
    queryFn: () => chatService.getChatById(chatId!),
    enabled: !!chatId,
  });
};

// Get messages for a chat
export const useMessages = (chatId: string, filters: MessagesFilters = {}) => {
  return useQuery({
    queryKey: chatKeys.messageList(chatId, filters),
    queryFn: () => chatService.getMessages(chatId, filters),
    enabled: !!chatId,
    staleTime: 0, // Always consider data stale for real-time chat
    refetchOnWindowFocus: true,
  });
};

// Create direct chat mutation
export const useCreateDirectChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDirectChatInput) =>
      chatService.createDirectChat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
};

// Send message mutation
export const useSendMessage = (chatId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageInput) =>
      chatService.sendMessage(chatId, data),
    onSuccess: (newMessage: ChatMessage) => {
      // Add message directly to cache for instant display
      queryClient.setQueriesData<MessagesResponse>(
        { queryKey: chatKeys.messages(chatId) },
        (oldData) => {
          if (!oldData) return oldData;

          // Check if message already exists
          const exists = oldData.items.some((m) => m.id === newMessage.id);
          if (exists) return oldData;

          // Add new message to the beginning (messages are newest first)
          return {
            ...oldData,
            items: [newMessage, ...oldData.items],
            pagination: {
              ...oldData.pagination,
              totalItems: oldData.pagination.totalItems + 1,
            },
          };
        }
      );

      // Update chat list to show latest message
      queryClient.setQueriesData<ChatsResponse>(
        { queryKey: chatKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            items: oldData.items.map((chat) => {
              if (chat.id === chatId) {
                return {
                  ...chat,
                  lastMessage: newMessage,
                  updatedAt: newMessage.createdAt,
                };
              }
              return chat;
            }),
          };
        }
      );

      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(chatId),
        refetchType: 'active',
      });
    },
  });
};

// Mark messages as read mutation
export const useMarkAsRead = (chatId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarkAsReadInput = {}) =>
      chatService.markAsRead(chatId, data),
    onSuccess: () => {
      // Clear unread count directly in cache
      queryClient.setQueriesData<ChatsResponse>(
        { queryKey: chatKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            items: oldData.items.map((chat) => {
              if (chat.id === chatId) {
                return { ...chat, unreadCount: 0 };
              }
              return chat;
            }),
          };
        }
      );

      // Invalidate notifications to update unread count/list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

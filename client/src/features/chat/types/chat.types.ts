// Chat types matching backend DTOs

export type ChatType = 'DIRECT' | 'GROUP';

export interface ChatParticipantUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface ChatParticipant {
  id: string;
  userId: string;
  user: ChatParticipantUser;
  joinedAt: string;
  lastReadAt: string;
}

export interface MessageSender {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  sender: MessageSender;
  content: string;
  mentionedUsers: string[];
  createdAt: string;
  readBy: string[];
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
}

// Request/Response types
export interface CreateDirectChatInput {
  otherUserId: string;
}

export interface SendMessageInput {
  content: string;
  mentionedUsers?: string[];
}

export interface MarkAsReadInput {
  messageId?: string;
}

export interface ChatFilters {
  page?: number;
  limit?: number;
}

export interface MessagesFilters {
  page?: number;
  limit?: number;
  before?: string;
}

// Paginated response types
export interface ChatsResponse {
  items: Chat[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface MessagesResponse {
  items: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

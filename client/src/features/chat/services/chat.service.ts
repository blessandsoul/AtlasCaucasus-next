import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
  Chat,
  ChatMessage,
  ChatsResponse,
  MessagesResponse,
  CreateDirectChatInput,
  SendMessageInput,
  MarkAsReadInput,
  ChatFilters,
  MessagesFilters,
} from '../types/chat.types';

class ChatService {
  async getMyChats(params: ChatFilters = {}) {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: ChatsResponse;
    }>(API_ENDPOINTS.CHATS.LIST, { params });

    return response.data.data;
  }

  async getChatById(chatId: string) {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: Chat;
    }>(API_ENDPOINTS.CHATS.GET(chatId));

    return response.data.data;
  }

  async createDirectChat(data: CreateDirectChatInput) {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: Chat;
    }>(API_ENDPOINTS.CHATS.DIRECT, data);

    return response.data.data;
  }

  async getMessages(chatId: string, params: MessagesFilters = {}) {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: MessagesResponse;
    }>(API_ENDPOINTS.CHATS.MESSAGES(chatId), { params });

    return response.data.data;
  }

  async sendMessage(chatId: string, data: SendMessageInput) {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: ChatMessage;
    }>(API_ENDPOINTS.CHATS.SEND_MESSAGE(chatId), data);

    return response.data.data;
  }

  async markAsRead(chatId: string, data: MarkAsReadInput = {}) {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { markedCount: number };
    }>(API_ENDPOINTS.CHATS.MARK_READ(chatId), data);

    return response.data.data;
  }
}

export const chatService = new ChatService();

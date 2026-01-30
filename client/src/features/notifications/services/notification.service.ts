import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
  INotification,
  INotificationFilters,
  INotificationsResponse,
  IUnreadCountResponse,
} from '../types/notification.types';

class NotificationService {
  async getNotifications(
    params: INotificationFilters = {}
  ): Promise<INotificationsResponse> {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST, {
      params,
    });
    return response.data.data;
  }

  async getUnreadCount(): Promise<IUnreadCountResponse> {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    return response.data.data;
  }

  async markAsRead(id: string): Promise<INotification> {
    const response = await apiClient.patch(
      API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)
    );
    return response.data.data;
  }

  async markAllAsRead(): Promise<{ count: number }> {
    const response = await apiClient.patch(
      API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ
    );
    return response.data.data;
  }

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
  }
}

export const notificationService = new NotificationService();

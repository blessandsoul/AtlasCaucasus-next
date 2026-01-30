export type NotificationType =
  | 'CHAT_MESSAGE'
  | 'CHAT_MENTION'
  | 'INQUIRY_RECEIVED'
  | 'INQUIRY_RESPONSE'
  | 'BOOKING_REQUEST'
  | 'PROFILE_VERIFIED'
  | 'SYSTEM';

export interface INotificationData {
  chatId?: string;
  messageId?: string;
  senderId?: string;
  senderName?: string;
  inquiryId?: string;
  [key: string]: unknown;
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: INotificationData | null;
  isRead: boolean;
  createdAt: string;
}

export interface IGroupedNotification extends INotification {
  count: number;
  childIds: string[];
}

export interface INotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}

export interface INotificationsResponse {
  items: INotification[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface IUnreadCountResponse {
  count: number;
}

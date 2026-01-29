import { NotificationType } from "@prisma/client";

export interface NotificationResponse {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data: NotificationData | null;
    isRead: boolean;
    createdAt: Date;
}

export interface NotificationData {
    chatId?: string;
    messageId?: string;
    senderId?: string;
    senderName?: string;
    inquiryId?: string;
    [key: string]: unknown; // Allow additional fields
}

export interface CreateNotificationData {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: NotificationData;
}

export interface NotificationFilters {
    isRead?: boolean;
    type?: NotificationType;
}

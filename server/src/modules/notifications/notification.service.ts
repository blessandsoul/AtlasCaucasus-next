import { notificationRepo } from "./notification.repo.js";
import { NotificationType } from "@prisma/client";
import { NotFoundError, ForbiddenError } from "../../libs/errors.js";
import { wsManager } from "../websocket/websocket.manager.js";
import { MessageType } from "../websocket/websocket.types.js";
import { logger } from "../../libs/logger.js";
import {
    CreateNotificationData,
    NotificationFilters,
    NotificationData,
} from "./notification.types.js";

export class NotificationService {
    /**
     * Create and deliver notification
     */
    async createNotification(data: CreateNotificationData) {
        // Create notification in database
        const notification = await notificationRepo.create(data);

        // Parse data back from JSON string for response
        const parsedNotification = {
            ...notification,
            data: notification.data ? JSON.parse(notification.data) : null,
        };

        // Try to deliver via WebSocket if user is online
        logger.debug(
            { userId: data.userId, notificationId: notification.id },
            "Attempting to send notification via WebSocket"
        );

        wsManager.sendToUser(data.userId, {
            type: MessageType.NOTIFICATION,
            payload: { notification: parsedNotification },
        });

        logger.info(
            { userId: data.userId, type: data.type, notificationId: notification.id },
            "Notification created and delivered"
        );

        return parsedNotification;
    }

    /**
     * Get user's notifications
     */
    async getUserNotifications(
        userId: string,
        page: number,
        limit: number,
        filters: NotificationFilters
    ) {
        const { notifications, total } = await notificationRepo.findUserNotifications(
            userId,
            page,
            limit,
            filters
        );

        // Parse data JSON for each notification
        const parsedNotifications = notifications.map((n) => ({
            ...n,
            data: n.data ? JSON.parse(n.data) : null,
        }));

        return { notifications: parsedNotifications, total };
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId: string): Promise<number> {
        return notificationRepo.getUnreadCount(userId);
    }

    /**
     * Mark notification as read
     */
    async markAsRead(userId: string, notificationId: string) {
        const notification = await notificationRepo.findById(notificationId);

        if (!notification) {
            throw new NotFoundError("Notification not found");
        }

        // Authorization: Can only mark own notifications
        if (notification.userId !== userId) {
            throw new ForbiddenError("Cannot mark other user's notification");
        }

        return notificationRepo.markAsRead(notificationId);
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string, notificationIds?: string[]) {
        const result = await notificationRepo.markManyAsRead(userId, notificationIds);
        return { updatedCount: result.count };
    }

    /**
     * Mark all notifications for a specific chat as read
     */
    async markChatNotificationsAsRead(userId: string, chatId: string) {
        const result = await notificationRepo.markChatNotificationsAsRead(userId, chatId);
        return { updatedCount: result.count };
    }

    /**
     * Delete notification
     */
    async deleteNotification(userId: string, notificationId: string) {
        const notification = await notificationRepo.findById(notificationId);

        if (!notification) {
            throw new NotFoundError("Notification not found");
        }

        // Authorization: Can only delete own notifications
        if (notification.userId !== userId) {
            throw new ForbiddenError("Cannot delete other user's notification");
        }

        await notificationRepo.delete(notificationId);
    }

    /**
     * Helper: Create chat message notification
     */
    async notifyChatMessage(
        recipientId: string,
        chatId: string,
        senderId: string,
        senderName: string,
        messagePreview: string
    ) {
        return this.createNotification({
            userId: recipientId,
            type: NotificationType.CHAT_MESSAGE,
            title: "New message",
            message: `${senderName}: ${messagePreview.substring(0, 100)}`,
            data: {
                chatId,
                senderId,
                senderName,
            },
        });
    }

    /**
     * Helper: Create chat mention notification
     */
    async notifyChatMention(
        recipientId: string,
        chatId: string,
        messageId: string,
        senderId: string,
        senderName: string,
        messagePreview: string
    ) {
        return this.createNotification({
            userId: recipientId,
            type: NotificationType.CHAT_MENTION,
            title: "You were mentioned",
            message: `${senderName} mentioned you: ${messagePreview.substring(0, 100)}`,
            data: {
                chatId,
                messageId,
                senderId,
                senderName,
            },
        });
    }

    /**
     * Helper: Create inquiry notification
     */
    async notifyInquiryReceived(
        recipientId: string,
        inquiryId: string,
        senderName: string
    ) {
        return this.createNotification({
            userId: recipientId,
            type: NotificationType.INQUIRY_RECEIVED,
            title: "New inquiry",
            message: `${senderName} sent you an inquiry`,
            data: {
                inquiryId,
            },
        });
    }

    /**
     * Helper: Create system notification
     */
    async notifySystem(userId: string, title: string, message: string, data?: NotificationData) {
        return this.createNotification({
            userId,
            type: NotificationType.SYSTEM,
            title,
            message,
            data,
        });
    }

    /**
     * Helper: Create profile verified notification
     */
    async notifyProfileVerified(userId: string, profileType: string) {
        return this.createNotification({
            userId,
            type: NotificationType.PROFILE_VERIFIED,
            title: "Profile Verified! 🎉",
            message: `Your ${profileType} profile has been verified and is now live.`,
        });
    }
}

export const notificationService = new NotificationService();

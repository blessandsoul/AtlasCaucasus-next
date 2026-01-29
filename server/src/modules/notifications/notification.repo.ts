import { prisma } from "../../libs/prisma.js";
import { NotificationType, Prisma } from "@prisma/client";
import { CreateNotificationData, NotificationFilters } from "./notification.types.js";

export class NotificationRepository {
    /**
     * Create notification
     */
    async create(data: CreateNotificationData) {
        return prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data ? JSON.stringify(data.data) : null,
            },
        });
    }

    /**
     * Get user's notifications with pagination and filters
     */
    async findUserNotifications(
        userId: string,
        page: number,
        limit: number,
        filters: NotificationFilters
    ) {
        const skip = (page - 1) * limit;

        const whereClause: Prisma.NotificationWhereInput = { userId };

        if (filters.isRead !== undefined) {
            whereClause.isRead = filters.isRead;
        }

        if (filters.type) {
            whereClause.type = filters.type;
        }

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.notification.count({ where: whereClause }),
        ]);

        return { notifications, total };
    }

    /**
     * Get notification by ID
     */
    async findById(id: string) {
        return prisma.notification.findUnique({
            where: { id },
        });
    }

    /**
     * Get unread count for user
     */
    async getUnreadCount(userId: string): Promise<number> {
        return prisma.notification.count({
            where: { userId, isRead: false },
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string) {
        return prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }

    /**
     * Mark multiple notifications as read
     */
    async markManyAsRead(userId: string, notificationIds?: string[]) {
        const whereClause: Prisma.NotificationWhereInput = { userId, isRead: false };

        if (notificationIds && notificationIds.length > 0) {
            whereClause.id = { in: notificationIds };
        }

        return prisma.notification.updateMany({
            where: whereClause,
            data: { isRead: true },
        });
    }

    /**
     * Mark chat notifications as read
     */
    async markChatNotificationsAsRead(userId: string, chatId: string) {
        return prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
                type: NotificationType.CHAT_MESSAGE,
                data: {
                    contains: chatId,
                },
            },
            data: { isRead: true },
        });
    }

    /**
     * Delete notification
     */
    async delete(id: string) {
        return prisma.notification.delete({
            where: { id },
        });
    }

    /**
     * Delete old read notifications (cleanup)
     */
    async deleteOldReadNotifications(daysOld: number) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        return prisma.notification.deleteMany({
            where: {
                isRead: true,
                createdAt: { lt: cutoffDate },
            },
        });
    }
}

export const notificationRepo = new NotificationRepository();

import { FastifyRequest, FastifyReply } from "fastify";
import { notificationService } from "./notification.service.js";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import { NotificationQuerySchema, MarkAsReadSchema } from "./notification.schemas.js";

export class NotificationController {
    /**
     * GET /api/v1/notifications
     * Get user's notifications
     */
    async getNotifications(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const query = NotificationQuerySchema.parse(request.query);

        const { notifications, total } = await notificationService.getUserNotifications(
            userId,
            query.page,
            query.limit,
            {
                isRead: query.isRead,
                type: query.type,
            }
        );

        return reply.send(
            paginatedResponse(
                "Notifications retrieved",
                notifications,
                query.page,
                query.limit,
                total
            )
        );
    }

    /**
     * GET /api/v1/notifications/unread-count
     * Get unread notification count
     */
    async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const count = await notificationService.getUnreadCount(userId);

        return reply.send(successResponse("Unread count retrieved", { count }));
    }

    /**
     * PATCH /api/v1/notifications/:id/read
     * Mark notification as read
     */
    async markAsRead(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const { id } = request.params;

        await notificationService.markAsRead(userId, id);

        return reply.send(successResponse("Notification marked as read", null));
    }

    /**
     * PATCH /api/v1/notifications/read-all
     * Mark all (or selected) notifications as read
     */
    async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const body = MarkAsReadSchema.parse(request.body || {});

        const result = await notificationService.markAllAsRead(userId, body.notificationIds);

        return reply.send(successResponse("Notifications marked as read", result));
    }

    /**
     * DELETE /api/v1/notifications/:id
     * Delete notification
     */
    async deleteNotification(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const { id } = request.params;

        await notificationService.deleteNotification(userId, id);

        return reply.send(successResponse("Notification deleted", null));
    }
}

export const notificationController = new NotificationController();

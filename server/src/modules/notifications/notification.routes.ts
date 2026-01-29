import { FastifyInstance } from "fastify";
import { notificationController } from "./notification.controller.js";
import { authGuard } from "../../middlewares/authGuard.js";

export async function notificationRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook("preHandler", authGuard);

    app.get(
        "/notifications",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        notificationController.getNotifications.bind(notificationController)
    );

    app.get(
        "/notifications/unread-count",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        notificationController.getUnreadCount.bind(notificationController)
    );

    app.patch(
        "/notifications/:id/read",
        {
            config: {
                rateLimit: {
                    max: 60,
                    timeWindow: "1 minute",
                },
            },
        },
        notificationController.markAsRead.bind(notificationController)
    );

    app.patch(
        "/notifications/read-all",
        {
            config: {
                rateLimit: {
                    max: 30,
                    timeWindow: "1 minute",
                },
            },
        },
        notificationController.markAllAsRead.bind(notificationController)
    );

    app.delete(
        "/notifications/:id",
        {
            config: {
                rateLimit: {
                    max: 30,
                    timeWindow: "1 minute",
                },
            },
        },
        notificationController.deleteNotification.bind(notificationController)
    );
}

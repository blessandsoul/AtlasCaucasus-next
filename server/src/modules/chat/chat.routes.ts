import { FastifyInstance } from "fastify";
import { chatController } from "./chat.controller.js";
import { authGuard } from "../../middlewares/authGuard.js";

export async function chatRoutes(app: FastifyInstance): Promise<void> {
    // All chat routes require authentication
    app.addHook("preHandler", authGuard);

    // ═══════════════════════════════════════════════════════════
    // CREATE CHATS
    // ═══════════════════════════════════════════════════════════

    // Create direct chat (1-on-1)
    app.post(
        "/chats/direct",
        {
            config: {
                rateLimit: {
                    max: 20,
                    timeWindow: "1 minute",
                },
            },
        },
        chatController.createDirectChat.bind(chatController)
    );

    // Create group chat (TOUR_AGENT only)
    app.post(
        "/chats/group",
        {
            config: {
                rateLimit: {
                    max: 10,
                    timeWindow: "1 minute",
                },
            },
        },
        chatController.createGroupChat.bind(chatController)
    );

    // ═══════════════════════════════════════════════════════════
    // GET CHATS
    // ═══════════════════════════════════════════════════════════

    // Get user's chats (inbox)
    app.get(
        "/chats",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        chatController.getChats.bind(chatController)
    );

    // Get chat by ID
    app.get(
        "/chats/:chatId",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        chatController.getChatById.bind(chatController)
    );

    // ═══════════════════════════════════════════════════════════
    // MESSAGES
    // ═══════════════════════════════════════════════════════════

    // Send message
    app.post(
        "/chats/:chatId/messages",
        {
            config: {
                rateLimit: {
                    max: 60,
                    timeWindow: "1 minute",
                },
            },
        },
        chatController.sendMessage.bind(chatController)
    );

    // Get messages
    app.get(
        "/chats/:chatId/messages",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        chatController.getMessages.bind(chatController)
    );

    // ═══════════════════════════════════════════════════════════
    // READ RECEIPTS
    // ═══════════════════════════════════════════════════════════

    // Mark messages as read
    app.post(
        "/chats/:chatId/read",
        {
            config: {
                rateLimit: {
                    max: 60,
                    timeWindow: "1 minute",
                },
            },
        },
        chatController.markAsRead.bind(chatController)
    );

    // ═══════════════════════════════════════════════════════════
    // PARTICIPANTS
    // ═══════════════════════════════════════════════════════════

    // Add participant to group chat
    app.post(
        "/chats/:chatId/participants",
        {
            config: {
                rateLimit: {
                    max: 20,
                    timeWindow: "1 minute",
                },
            },
        },
        chatController.addParticipant.bind(chatController)
    );

    // Leave chat
    app.delete(
        "/chats/:chatId/leave",
        {
            config: {
                rateLimit: {
                    max: 20,
                    timeWindow: "1 minute",
                },
            },
        },
        chatController.leaveChat.bind(chatController)
    );
}

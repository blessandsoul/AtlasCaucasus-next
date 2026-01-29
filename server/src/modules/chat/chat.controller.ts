import { FastifyRequest, FastifyReply } from "fastify";
import { chatService } from "./chat.service.js";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import {
    CreateDirectChatSchema,
    CreateGroupChatSchema,
    SendMessageSchema,
    MarkAsReadSchema,
    AddParticipantSchema,
    ChatQuerySchema,
    MessagesQuerySchema,
} from "./chat.schemas.js";
import type { UserRole } from "../users/user.types.js";
import { wsManager } from "../websocket/websocket.manager.js";
import { MessageType } from "../websocket/websocket.types.js";
import { notificationService } from "../notifications/notification.service.js";

export class ChatController {
    /**
     * POST /api/v1/chats/direct
     * Create direct chat (1-on-1)
     */
    async createDirectChat(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const body = CreateDirectChatSchema.parse(request.body);
        const chat = await chatService.createDirectChat(userId, body.otherUserId);

        return reply.status(201).send(successResponse("Direct chat created", chat));
    }

    /**
     * POST /api/v1/chats/group
     * Create group chat (TOUR_AGENT only)
     */
    async createGroupChat(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const userRoles = request.user.roles as UserRole[];
        const body = CreateGroupChatSchema.parse(request.body);
        const chat = await chatService.createGroupChat(
            userId,
            userRoles,
            body.name,
            body.participantIds
        );

        return reply.status(201).send(successResponse("Group chat created", chat));
    }

    /**
     * GET /api/v1/chats
     * Get user's chats (inbox)
     */
    async getChats(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const query = ChatQuerySchema.parse(request.query);
        const { chats, total } = await chatService.getUserChats(
            userId,
            query.page,
            query.limit
        );

        return reply.send(
            paginatedResponse("Chats retrieved", chats, query.page, query.limit, total)
        );
    }

    /**
     * GET /api/v1/chats/:chatId
     * Get chat details
     */
    async getChatById(
        request: FastifyRequest<{ Params: { chatId: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const { chatId } = request.params;
        const chat = await chatService.getChatById(userId, chatId);

        return reply.send(successResponse("Chat retrieved", chat));
    }

    /**
     * POST /api/v1/chats/:chatId/messages
     * Send message to chat
     */
    async sendMessage(
        request: FastifyRequest<{ Params: { chatId: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const { chatId } = request.params;
        const body = SendMessageSchema.parse(request.body);
        const message = await chatService.sendMessage(
            userId,
            chatId,
            body.content,
            body.mentionedUsers
        );

        // Broadcast to all participants via WebSocket for real-time updates
        const participantIds = await chatService.getParticipantIds(chatId);
        wsManager.sendToUsers(participantIds, {
            type: MessageType.CHAT_MESSAGE,
            payload: { message },
        });

        // Create notifications for all participants (except sender)
        // This triggers WebSocket notification events for real-time bell updates
        const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
        const messagePreview = body.content.substring(0, 100);

        for (const participantId of participantIds) {
            if (participantId === userId) continue; // Skip sender

            // Create notification (this sends via WebSocket internally)
            notificationService.notifyChatMessage(
                participantId,
                chatId,
                userId,
                senderName,
                messagePreview
            ).catch(() => { }); // Fire and forget, don't block response
        }

        return reply.status(201).send(successResponse("Message sent", message));
    }

    /**
     * GET /api/v1/chats/:chatId/messages
     * Get messages for a chat
     */
    async getMessages(
        request: FastifyRequest<{ Params: { chatId: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const { chatId } = request.params;
        const query = MessagesQuerySchema.parse(request.query);
        const { messages, total } = await chatService.getMessages(
            userId,
            chatId,
            query.page,
            query.limit,
            query.before
        );

        return reply.send(
            paginatedResponse(
                "Messages retrieved",
                messages,
                query.page,
                query.limit,
                total
            )
        );
    }

    /**
     * POST /api/v1/chats/:chatId/read
     * Mark messages as read
     */
    async markAsRead(
        request: FastifyRequest<{ Params: { chatId: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const { chatId } = request.params;
        const body = MarkAsReadSchema.parse(request.body || {});
        const result = await chatService.markAsRead(
            userId,
            chatId,
            body.messageId
        );

        // Only broadcast read receipt if messages were actually marked as read
        if (result.markedCount > 0) {
            const participantIds = await chatService.getParticipantIds(chatId);
            const otherParticipants = participantIds.filter((id) => id !== userId);
            wsManager.sendToUsers(otherParticipants, {
                type: MessageType.CHAT_READ,
                payload: {
                    chatId,
                    userId,
                    markedCount: result.markedCount,
                },
            });
        }

        return reply.send(successResponse("Messages marked as read", result));
    }

    /**
     * POST /api/v1/chats/:chatId/participants
     * Add participant to group chat
     */
    async addParticipant(
        request: FastifyRequest<{ Params: { chatId: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const { chatId } = request.params;
        const body = AddParticipantSchema.parse(request.body);
        const participant = await chatService.addParticipant(
            userId,
            chatId,
            body.userId
        );

        return reply.status(201).send(successResponse("Participant added", participant));
    }

    /**
     * DELETE /api/v1/chats/:chatId/leave
     * Leave chat
     */
    async leaveChat(
        request: FastifyRequest<{ Params: { chatId: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const { chatId } = request.params;
        await chatService.leaveChat(userId, chatId);

        return reply.send(successResponse("Left chat successfully", null));
    }
}

export const chatController = new ChatController();

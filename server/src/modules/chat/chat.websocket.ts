import {
    AuthenticatedWebSocket,
    MessageType,
    SendChatMessagePayload,
    TypingPayload,
    MarkReadPayload,
} from "../websocket/websocket.types.js";
import { wsManager } from "../websocket/websocket.manager.js";
import { chatService } from "./chat.service.js";
import { chatRepo } from "./chat.repo.js";
import { logger } from "../../libs/logger.js";
import { redisClient } from "../../libs/redis.js";
import { prisma } from "../../libs/prisma.js";
import { notificationService } from "../notifications/notification.service.js";

/**
 * Handle incoming chat message via WebSocket
 * Sends message and broadcasts to all participants
 */
export async function handleChatMessage(
    ws: AuthenticatedWebSocket,
    payload: SendChatMessagePayload
): Promise<void> {
    try {
        const { chatId, content, mentionedUsers } = payload;

        if (!chatId || !content) {
            ws.send(
                JSON.stringify({
                    type: MessageType.ERROR,
                    payload: { message: "chatId and content are required" },
                })
            );
            return;
        }

        // Send message via service (includes validation)
        const message = await chatService.sendMessage(
            ws.userId,
            chatId,
            content,
            mentionedUsers || []
        );

        // Get sender info for notifications
        const sender = await prisma.user.findUnique({
            where: { id: ws.userId },
            select: { firstName: true, lastName: true },
        });
        const senderName = sender ? `${sender.firstName} ${sender.lastName}` : "User";
        const messagePreview = content.substring(0, 100);

        // Get all chat participants
        const participantIds = await chatService.getParticipantIds(chatId);

        // Broadcast message to all participants (including sender for confirmation)
        wsManager.sendToUsers(participantIds, {
            type: MessageType.CHAT_MESSAGE,
            payload: { message },
        });

        // Create notifications for mentioned users (whether online or offline)
        if (mentionedUsers && mentionedUsers.length > 0) {
            for (const mentionedUserId of mentionedUsers) {
                // Don't notify the sender if they mentioned themselves
                if (mentionedUserId === ws.userId) continue;

                try {
                    await notificationService.notifyChatMention(
                        mentionedUserId,
                        chatId,
                        message.id,
                        ws.userId,
                        senderName,
                        messagePreview
                    );
                    logger.info(
                        { mentionedUserId, messageId: message.id },
                        "Mention notification created"
                    );
                } catch (err) {
                    logger.error({ err, mentionedUserId }, "Failed to create mention notification");
                }
            }
        }

        // Create notifications for all participants (excluding mentioned users & sender)
        // This ensures the notification bell updates for everyone
        for (const participantId of participantIds) {
            // Skip sender
            if (participantId === ws.userId) continue;
            // Skip if already got mention notification
            if (mentionedUsers && mentionedUsers.includes(participantId)) continue;

            try {
                await notificationService.notifyChatMessage(
                    participantId,
                    chatId,
                    ws.userId,
                    senderName,
                    messagePreview
                );
                logger.debug(
                    { participantId, messageId: message.id },
                    "Chat message notification created"
                );
            } catch (err) {
                logger.error({ err, participantId }, "Failed to create message notification");
            }
        }

        logger.info(
            { chatId, messageId: message.id, senderId: ws.userId },
            "Chat message sent via WebSocket"
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to send message";
        logger.error({ error, userId: ws.userId }, "Failed to send chat message");
        ws.send(
            JSON.stringify({
                type: MessageType.ERROR,
                payload: { message: errorMessage },
            })
        );
    }
}

/**
 * Handle typing indicator
 * Broadcasts to other participants that user is typing
 */
export async function handleTyping(
    ws: AuthenticatedWebSocket,
    payload: TypingPayload
): Promise<void> {
    try {
        const { chatId } = payload;

        if (!chatId) {
            return;
        }

        // Verify user is participant
        const isParticipant = await chatRepo.isParticipant(ws.userId, chatId);
        if (!isParticipant) {
            return;
        }

        // Get sender info for display name
        const user = await prisma.user.findUnique({
            where: { id: ws.userId },
            select: { firstName: true, lastName: true },
        });

        const userName = user ? `${user.firstName} ${user.lastName}` : "User";

        // Get all chat participants except sender
        const participantIds = await chatService.getParticipantIds(chatId);
        const otherParticipants = participantIds.filter((id) => id !== ws.userId);

        // Broadcast typing indicator to other participants
        wsManager.sendToUsers(otherParticipants, {
            type: MessageType.CHAT_TYPING,
            payload: {
                chatId,
                userId: ws.userId,
                userName,
            },
        });

        // Store typing status in Redis with 5-second TTL
        const key = `typing:${chatId}:${ws.userId}`;
        await redisClient.setEx(key, 5, "1");

        logger.debug({ chatId, userId: ws.userId }, "User is typing");
    } catch (error) {
        logger.error({ error, userId: ws.userId }, "Failed to handle typing indicator");
    }
}

/**
 * Handle stop typing
 * Broadcasts to other participants that user stopped typing
 */
export async function handleStopTyping(
    ws: AuthenticatedWebSocket,
    payload: TypingPayload
): Promise<void> {
    try {
        const { chatId } = payload;

        if (!chatId) {
            return;
        }

        // Delete typing indicator from Redis
        const key = `typing:${chatId}:${ws.userId}`;
        await redisClient.del(key);

        // Get chat participants
        const participantIds = await chatService.getParticipantIds(chatId);
        const otherParticipants = participantIds.filter((id) => id !== ws.userId);

        // Broadcast stop typing
        wsManager.sendToUsers(otherParticipants, {
            type: MessageType.CHAT_STOP_TYPING,
            payload: {
                chatId,
                userId: ws.userId,
            },
        });

        logger.debug({ chatId, userId: ws.userId }, "User stopped typing");
    } catch (error) {
        logger.error({ error, userId: ws.userId }, "Failed to handle stop typing");
    }
}

/**
 * Handle mark as read via WebSocket
 * Updates read status and broadcasts read receipt
 */
export async function handleMarkAsRead(
    ws: AuthenticatedWebSocket,
    payload: MarkReadPayload
): Promise<void> {
    try {
        const { chatId, messageId } = payload;

        if (!chatId) {
            return;
        }

        // Mark as read via service
        await chatService.markAsRead(ws.userId, chatId, messageId);

        // Get chat participants
        const participantIds = await chatService.getParticipantIds(chatId);
        const otherParticipants = participantIds.filter((id) => id !== ws.userId);

        // Broadcast read receipt to other participants
        wsManager.sendToUsers(otherParticipants, {
            type: MessageType.CHAT_READ,
            payload: {
                chatId,
                userId: ws.userId,
                messageId,
            },
        });

        logger.debug({ chatId, userId: ws.userId, messageId }, "Messages marked as read");
    } catch (error) {
        logger.error({ error, userId: ws.userId }, "Failed to mark as read");
    }
}

/**
 * Broadcast when a participant is added to a chat
 */
export async function broadcastParticipantAdded(
    chatId: string,
    addedUserId: string,
    addedUserName: string
): Promise<void> {
    try {
        const participantIds = await chatService.getParticipantIds(chatId);

        wsManager.sendToUsers(participantIds, {
            type: MessageType.CHAT_PARTICIPANT_ADDED,
            payload: {
                chatId,
                userId: addedUserId,
                userName: addedUserName,
            },
        });
    } catch (error) {
        logger.error({ error, chatId, addedUserId }, "Failed to broadcast participant added");
    }
}

/**
 * Broadcast when a participant leaves a chat
 */
export async function broadcastParticipantLeft(
    chatId: string,
    leftUserId: string,
    leftUserName: string
): Promise<void> {
    try {
        const participantIds = await chatService.getParticipantIds(chatId);

        wsManager.sendToUsers(participantIds, {
            type: MessageType.CHAT_PARTICIPANT_LEFT,
            payload: {
                chatId,
                userId: leftUserId,
                userName: leftUserName,
            },
        });
    } catch (error) {
        logger.error({ error, chatId, leftUserId }, "Failed to broadcast participant left");
    }
}

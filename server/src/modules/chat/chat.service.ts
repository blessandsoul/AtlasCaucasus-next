import { chatRepo } from "./chat.repo.js";
import { ChatType } from "@prisma/client";
import {
    BadRequestError,
    NotFoundError,
    ForbiddenError,
} from "../../libs/errors.js";
import { prisma } from "../../libs/prisma.js";
import type { UserRole } from "../users/user.types.js";
import { notificationService } from "../notifications/notification.service.js";

export class ChatService {
    /**
     * Create direct chat (1-on-1)
     * Rule: Anyone can create direct chats
     * Rule: Cannot create chat with yourself
     * Rule: Returns existing chat if one already exists
     */
    async createDirectChat(userId: string, otherUserId: string) {
        // Can't chat with yourself
        if (userId === otherUserId) {
            throw new BadRequestError("Cannot create chat with yourself");
        }

        // Check if other user exists
        const otherUser = await prisma.user.findUnique({
            where: { id: otherUserId },
            select: { id: true, isActive: true, deletedAt: true },
        });

        if (!otherUser || otherUser.deletedAt !== null) {
            throw new NotFoundError("User not found");
        }

        if (!otherUser.isActive) {
            throw new BadRequestError("Cannot create chat with inactive user");
        }

        // Check if direct chat already exists between these users
        const existingChat = await chatRepo.findDirectChat(userId, otherUserId);
        if (existingChat) {
            return existingChat; // Return existing chat
        }

        // Create new direct chat
        const chat = await chatRepo.createChat(ChatType.DIRECT, userId);

        // Add both users as participants
        await chatRepo.addParticipant(chat.id, userId);
        await chatRepo.addParticipant(chat.id, otherUserId);

        // Return chat with participants
        return chatRepo.findChatById(chat.id);
    }

    /**
     * Create group chat
     * Rule: Only TOUR_AGENT can create group chats
     * Rule: Maximum 100 participants (including creator)
     */
    async createGroupChat(
        userId: string,
        userRoles: UserRole[],
        name: string,
        participantIds: string[]
    ) {
        // BUSINESS RULE: Only TOUR_AGENT can create group chats
        if (!userRoles.includes("TOUR_AGENT")) {
            throw new ForbiddenError("Only tour agents can create group chats");
        }

        // BUSINESS RULE: Maximum 100 participants (including creator)
        if (participantIds.length > 99) {
            throw new BadRequestError(
                "Group chat can have maximum 100 participants"
            );
        }

        // Remove duplicates and creator from participant list
        const uniqueParticipants = [...new Set(participantIds)].filter(
            (id) => id !== userId
        );

        // Verify all participants exist and are active
        const participants = await prisma.user.findMany({
            where: {
                id: { in: uniqueParticipants },
                isActive: true,
                deletedAt: null,
            },
            select: { id: true },
        });

        if (participants.length !== uniqueParticipants.length) {
            throw new BadRequestError("Some participants not found or inactive");
        }

        // Create group chat
        const chat = await chatRepo.createChat(ChatType.GROUP, userId, name);

        // Add creator as participant
        await chatRepo.addParticipant(chat.id, userId);

        // Add all other participants
        await Promise.all(
            uniqueParticipants.map((participantId) =>
                chatRepo.addParticipant(chat.id, participantId)
            )
        );

        return chatRepo.findChatById(chat.id);
    }

    /**
     * Get user's chats (inbox)
     * Returns chats with last message and unread count
     */
    async getUserChats(userId: string, page: number, limit: number) {
        const { chats, total } = await chatRepo.findUserChats(userId, page, limit);

        // Add unread count for each chat
        const chatsWithMetadata = await Promise.all(
            chats.map(async (chat) => {
                const unreadCount = await chatRepo.getUnreadCount(userId, chat.id);

                // Get the last message if exists
                const lastMessage = chat.messages[0] || null;

                return {
                    id: chat.id,
                    type: chat.type,
                    name: chat.name,
                    creatorId: chat.creatorId,
                    createdAt: chat.createdAt,
                    updatedAt: chat.updatedAt,
                    participants: chat.participants,
                    unreadCount,
                    lastMessage: lastMessage
                        ? {
                            id: lastMessage.id,
                            chatId: lastMessage.chatId,
                            senderId: lastMessage.senderId,
                            sender: lastMessage.sender,
                            content: lastMessage.content,
                            mentionedUsers: lastMessage.mentionedUsers as string[],
                            createdAt: lastMessage.createdAt,
                            readBy: [], // Not included in list view for performance
                        }
                        : null,
                };
            })
        );

        return { chats: chatsWithMetadata, total };
    }

    /**
     * Get chat by ID
     * Rule: User must be participant
     */
    async getChatById(userId: string, chatId: string) {
        const chat = await chatRepo.findChatById(chatId);

        if (!chat) {
            throw new NotFoundError("Chat not found");
        }

        // Authorization: User must be participant
        const isParticipant = await chatRepo.isParticipant(userId, chatId);
        if (!isParticipant) {
            throw new ForbiddenError("You are not a participant of this chat");
        }

        return chat;
    }

    /**
     * Send message
     * Rule: Must be participant
     * Rule: Can only mention users who are participants
     */
    async sendMessage(
        userId: string,
        chatId: string,
        content: string,
        mentionedUsers: string[] = []
    ) {
        // Authorization: User must be participant
        const isParticipant = await chatRepo.isParticipant(userId, chatId);
        if (!isParticipant) {
            throw new ForbiddenError("You are not a participant of this chat");
        }

        // BUSINESS RULE: Can only mention users who are participants
        if (mentionedUsers.length > 0) {
            const participantIds = await chatRepo.getParticipantIds(chatId);

            const invalidMentions = mentionedUsers.filter(
                (id) => !participantIds.includes(id)
            );

            if (invalidMentions.length > 0) {
                throw new BadRequestError("Cannot mention users not in the chat");
            }
        }

        // Create message
        const message = await chatRepo.createMessage(
            chatId,
            userId,
            content,
            mentionedUsers
        );

        // Update chat's updatedAt timestamp (moves to top of inbox)
        await chatRepo.touchChat(chatId);

        // Return formatted message
        return {
            id: message.id,
            chatId: message.chatId,
            senderId: message.senderId,
            sender: message.sender,
            content: message.content,
            mentionedUsers: message.mentionedUsers as string[],
            createdAt: message.createdAt,
            readBy: [], // New message has no reads yet
        };
    }

    /**
     * Get messages for a chat
     * Rule: Must be participant
     */
    async getMessages(
        userId: string,
        chatId: string,
        page: number,
        limit: number,
        before?: string
    ) {
        // Authorization: User must be participant
        const isParticipant = await chatRepo.isParticipant(userId, chatId);
        if (!isParticipant) {
            throw new ForbiddenError("You are not a participant of this chat");
        }

        const { messages, total } = await chatRepo.findMessages(
            chatId,
            page,
            limit,
            before
        );

        // Format messages with readBy array
        const formattedMessages = messages.map((msg) => ({
            id: msg.id,
            chatId: msg.chatId,
            senderId: msg.senderId,
            sender: msg.sender,
            content: msg.content,
            mentionedUsers: msg.mentionedUsers as string[],
            createdAt: msg.createdAt,
            readBy: msg.readReceipts.map((r) => r.userId),
        }));

        return { messages: formattedMessages, total };
    }

    /**
     * Mark messages as read
     * Rule: Must be participant
     */
    async markAsRead(userId: string, chatId: string, upToMessageId?: string) {
        // Authorization: User must be participant
        const isParticipant = await chatRepo.isParticipant(userId, chatId);
        if (!isParticipant) {
            throw new ForbiddenError("You are not a participant of this chat");
        }

        const count = await chatRepo.markMessagesAsRead(
            userId,
            chatId,
            upToMessageId
        );

        // Sync: Mark associated notifications as read
        if (count > 0) {
            await notificationService.markChatNotificationsAsRead(userId, chatId).catch((err) => {
                // Don't fail the request if notification update fails, just log it
                console.error("Failed to sync notification read status:", err);
            });
        }

        return { markedCount: count };
    }

    /**
     * Add participant to group chat
     * Rule: Only creator can add participants
     * Rule: Can only add to group chats
     * Rule: Max 100 total participants
     */
    async addParticipant(userId: string, chatId: string, newUserId: string) {
        const chat = await chatRepo.findChatById(chatId);

        if (!chat) {
            throw new NotFoundError("Chat not found");
        }

        // BUSINESS RULE: Can only add to group chats
        if (chat.type !== ChatType.GROUP) {
            throw new BadRequestError("Can only add participants to group chats");
        }

        // Authorization: Only creator can add participants
        if (chat.creatorId !== userId) {
            throw new ForbiddenError("Only creator can add participants");
        }

        // BUSINESS RULE: Check participant limit (100 max)
        const currentCount = await chatRepo.getParticipantCount(chatId);
        if (currentCount >= 100) {
            throw new BadRequestError(
                "Group chat has reached maximum capacity (100)"
            );
        }

        // Check if user already participant
        const isAlreadyParticipant = await chatRepo.isParticipant(
            newUserId,
            chatId
        );
        if (isAlreadyParticipant) {
            throw new BadRequestError("User is already a participant");
        }

        // Verify new user exists and is active
        const newUser = await prisma.user.findUnique({
            where: { id: newUserId },
            select: { id: true, isActive: true, deletedAt: true },
        });

        if (!newUser || newUser.deletedAt !== null) {
            throw new NotFoundError("User not found");
        }

        if (!newUser.isActive) {
            throw new BadRequestError("Cannot add inactive user to chat");
        }

        return chatRepo.addParticipant(chatId, newUserId);
    }

    /**
     * Leave chat
     * Rule: Must be participant
     * Rule: If no participants left, chat is deleted
     */
    async leaveChat(userId: string, chatId: string) {
        const isParticipant = await chatRepo.isParticipant(userId, chatId);
        if (!isParticipant) {
            throw new ForbiddenError("You are not a participant of this chat");
        }

        await chatRepo.removeParticipant(chatId, userId);

        // If no participants left, delete chat
        const remainingCount = await chatRepo.getParticipantCount(chatId);
        if (remainingCount === 0) {
            await chatRepo.deleteChat(chatId);
        }
    }

    /**
     * Get participant IDs for a chat
     * Used by WebSocket handler for broadcasting
     */
    async getParticipantIds(chatId: string): Promise<string[]> {
        return chatRepo.getParticipantIds(chatId);
    }

    /**
     * Get unread count for a specific chat
     */
    async getUnreadCount(userId: string, chatId: string): Promise<number> {
        const isParticipant = await chatRepo.isParticipant(userId, chatId);
        if (!isParticipant) {
            return 0;
        }
        return chatRepo.getUnreadCount(userId, chatId);
    }
}

export const chatService = new ChatService();

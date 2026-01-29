import { prisma } from "../../libs/prisma.js";
import { ChatType } from "@prisma/client";

// Common select for user info in chat responses
const userSelectFields = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
};

const senderSelectFields = {
    id: true,
    firstName: true,
    lastName: true,
};

export class ChatRepository {
    /**
     * Create a new chat
     */
    async createChat(type: ChatType, creatorId: string, name?: string) {
        return prisma.chat.create({
            data: { type, name, creatorId },
            include: {
                creator: {
                    select: userSelectFields,
                },
            },
        });
    }

    /**
     * Find direct chat between two users
     */
    async findDirectChat(userId1: string, userId2: string) {
        return prisma.chat.findFirst({
            where: {
                type: ChatType.DIRECT,
                AND: [
                    { participants: { some: { userId: userId1 } } },
                    { participants: { some: { userId: userId2 } } },
                ],
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: userSelectFields,
                        },
                    },
                },
            },
        });
    }

    /**
     * Add participant to chat
     */
    async addParticipant(chatId: string, userId: string) {
        return prisma.chatParticipant.create({
            data: { chatId, userId },
            include: {
                user: {
                    select: userSelectFields,
                },
            },
        });
    }

    /**
     * Get chat by ID with participants
     */
    async findChatById(chatId: string) {
        return prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: userSelectFields,
                        },
                    },
                },
            },
        });
    }

    /**
     * Get user's chats with pagination
     */
    async findUserChats(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [chats, total] = await Promise.all([
            prisma.chat.findMany({
                where: {
                    participants: { some: { userId } },
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: userSelectFields,
                            },
                        },
                    },
                    messages: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        include: {
                            sender: {
                                select: senderSelectFields,
                            },
                        },
                    },
                },
                orderBy: { updatedAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.chat.count({
                where: {
                    participants: { some: { userId } },
                },
            }),
        ]);

        return { chats, total };
    }

    /**
     * Create a message
     */
    async createMessage(
        chatId: string,
        senderId: string,
        content: string,
        mentionedUsers: string[]
    ) {
        return prisma.chatMessage.create({
            data: {
                chatId,
                senderId,
                content,
                mentionedUsers: mentionedUsers,
            },
            include: {
                sender: {
                    select: senderSelectFields,
                },
            },
        });
    }

    /**
     * Get messages for a chat with pagination
     */
    async findMessages(
        chatId: string,
        page: number,
        limit: number,
        before?: string
    ) {
        const skip = (page - 1) * limit;
        const whereClause: { chatId: string; createdAt?: { lt: Date } } = { chatId };

        // Cursor-based pagination if 'before' message ID provided
        if (before) {
            const beforeMessage = await prisma.chatMessage.findUnique({
                where: { id: before },
                select: { createdAt: true },
            });

            if (beforeMessage) {
                whereClause.createdAt = { lt: beforeMessage.createdAt };
            }
        }

        const [messages, total] = await Promise.all([
            prisma.chatMessage.findMany({
                where: whereClause,
                include: {
                    sender: {
                        select: senderSelectFields,
                    },
                    readReceipts: {
                        select: {
                            userId: true,
                            readAt: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: before ? 0 : skip,
                take: limit,
            }),
            prisma.chatMessage.count({ where: { chatId } }),
        ]);

        return { messages, total };
    }

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(
        userId: string,
        chatId: string,
        upToMessageId?: string
    ) {
        // Update participant's lastReadAt timestamp
        await prisma.chatParticipant.updateMany({
            where: { chatId, userId },
            data: { lastReadAt: new Date() },
        });

        // Build where clause for messages to mark
        const whereClause: {
            chatId: string;
            senderId: { not: string };
            createdAt?: { lte: Date };
        } = {
            chatId,
            senderId: { not: userId }, // Don't mark own messages as read
        };

        if (upToMessageId) {
            const upToMessage = await prisma.chatMessage.findUnique({
                where: { id: upToMessageId },
                select: { createdAt: true },
            });

            if (upToMessage) {
                whereClause.createdAt = { lte: upToMessage.createdAt };
            }
        }

        // Find messages to mark
        const messagesToMark = await prisma.chatMessage.findMany({
            where: whereClause,
            select: { id: true },
        });

        // Create read receipts (skip duplicates)
        if (messagesToMark.length > 0) {
            await prisma.messageReadReceipt.createMany({
                data: messagesToMark.map((msg) => ({
                    messageId: msg.id,
                    userId,
                })),
                skipDuplicates: true,
            });
        }

        return messagesToMark.length;
    }

    /**
     * Get unread message count for a chat
     */
    async getUnreadCount(userId: string, chatId: string): Promise<number> {
        const participant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: { chatId, userId },
            },
            select: { lastReadAt: true },
        });

        if (!participant) return 0;

        return prisma.chatMessage.count({
            where: {
                chatId,
                senderId: { not: userId },
                createdAt: { gt: participant.lastReadAt },
            },
        });
    }

    /**
     * Check if user is participant of chat
     */
    async isParticipant(userId: string, chatId: string): Promise<boolean> {
        const count = await prisma.chatParticipant.count({
            where: { chatId, userId },
        });
        return count > 0;
    }

    /**
     * Get participant count for a chat
     */
    async getParticipantCount(chatId: string): Promise<number> {
        return prisma.chatParticipant.count({
            where: { chatId },
        });
    }

    /**
     * Remove participant from chat
     */
    async removeParticipant(chatId: string, userId: string) {
        return prisma.chatParticipant.delete({
            where: {
                chatId_userId: { chatId, userId },
            },
        });
    }

    /**
     * Get all participant user IDs for a chat
     */
    async getParticipantIds(chatId: string): Promise<string[]> {
        const participants = await prisma.chatParticipant.findMany({
            where: { chatId },
            select: { userId: true },
        });
        return participants.map((p) => p.userId);
    }

    /**
     * Delete a chat and all related data
     */
    async deleteChat(chatId: string) {
        return prisma.chat.delete({
            where: { id: chatId },
        });
    }

    /**
     * Update chat's updatedAt timestamp (used when new message arrives)
     */
    async touchChat(chatId: string) {
        return prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() },
        });
    }
}

export const chatRepo = new ChatRepository();

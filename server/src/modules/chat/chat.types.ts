import { ChatType } from "@prisma/client";

export interface ChatResponse {
    id: string;
    type: ChatType;
    name: string | null;
    creatorId: string;
    createdAt: Date;
    updatedAt: Date;
    participants: ChatParticipantResponse[];
    lastMessage?: MessageResponse | null;
    unreadCount?: number;
}

export interface ChatParticipantResponse {
    id: string;
    userId: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    joinedAt: Date;
    lastReadAt: Date;
}

export interface MessageResponse {
    id: string;
    chatId: string;
    senderId: string;
    sender: {
        id: string;
        firstName: string;
        lastName: string;
    };
    content: string;
    mentionedUsers: string[];
    createdAt: Date;
    readBy: string[]; // User IDs who have read this message
}

export interface CreateDirectChatData {
    otherUserId: string;
}

export interface CreateGroupChatData {
    name: string;
    participantIds: string[]; // Not including creator
}

export interface SendMessageData {
    chatId: string;
    content: string;
    mentionedUsers?: string[];
}

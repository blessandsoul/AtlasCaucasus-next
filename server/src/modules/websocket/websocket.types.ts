import { WebSocket } from "ws";

export interface AuthenticatedWebSocket extends WebSocket {
    userId: string;
    connectionId: string;
    isAlive: boolean;
}

export interface WebSocketMessage {
    type: string;
    payload: unknown;
}

export enum MessageType {
    // Client to server
    HEARTBEAT = "heartbeat",

    // Server to client
    CONNECTED = "connected",
    ERROR = "error",

    // Chat messages
    CHAT_MESSAGE = "chat:message",
    CHAT_TYPING = "chat:typing",
    CHAT_STOP_TYPING = "chat:stop_typing",
    CHAT_READ = "chat:read",
    CHAT_PARTICIPANT_ADDED = "chat:participant_added",
    CHAT_PARTICIPANT_LEFT = "chat:participant_left",

    // Notifications
    NOTIFICATION = "notification",

    // Presence
    USER_ONLINE = "user:online",
    USER_OFFLINE = "user:offline",
}

// ═══════════════════════════════════════════════════════════
// CHAT PAYLOAD INTERFACES
// ═══════════════════════════════════════════════════════════

export interface ChatMessagePayload {
    message: {
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
    };
}

export interface ChatTypingPayload {
    chatId: string;
    userId: string;
    userName: string;
}

export interface ChatStopTypingPayload {
    chatId: string;
    userId: string;
}

export interface ChatReadPayload {
    chatId: string;
    userId: string;
    messageId?: string;
}

export interface ChatParticipantPayload {
    chatId: string;
    userId: string;
    userName: string;
}

// ═══════════════════════════════════════════════════════════
// CLIENT-TO-SERVER PAYLOADS
// ═══════════════════════════════════════════════════════════

export interface SendChatMessagePayload {
    chatId: string;
    content: string;
    mentionedUsers?: string[];
}

export interface TypingPayload {
    chatId: string;
}

export interface MarkReadPayload {
    chatId: string;
    messageId?: string;
}

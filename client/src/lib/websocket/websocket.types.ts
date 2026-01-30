// WebSocket message types matching server implementation

export enum MessageType {
    // Client to server
    HEARTBEAT = 'heartbeat',

    // Server to client
    CONNECTED = 'connected',
    ERROR = 'error',

    // Presence events
    USER_ONLINE = 'user:online',
    USER_OFFLINE = 'user:offline',

    // Notifications
    NOTIFICATION = 'notification',

    // Chat events
    CHAT_MESSAGE = 'chat:message',
    CHAT_TYPING = 'chat:typing',
    CHAT_STOP_TYPING = 'chat:stop_typing',
    CHAT_READ = 'chat:read',
    CHAT_PARTICIPANT_ADDED = 'chat:participant_added',
    CHAT_PARTICIPANT_LEFT = 'chat:participant_left',
}

export interface WebSocketMessage<T = unknown> {
    type: MessageType | string;
    payload: T;
}

export interface ConnectedPayload {
    connectionId: string;
    userId: string;
}

export interface UserPresencePayload {
    userId: string;
    timestamp: number;
}

export interface HeartbeatPayload {
    timestamp: number;
}

export interface ErrorPayload {
    message: string;
}

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
        createdAt: string;
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
    messageId: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

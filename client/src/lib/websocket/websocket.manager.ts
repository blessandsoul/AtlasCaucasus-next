'use client';

import { store } from '@/store';
import { queryClient } from '@/lib/api/query-client';
import {
    MessageType,
    type ConnectionStatus,
    type WebSocketMessage,
    type UserPresencePayload,
} from './websocket.types';

type MessageHandler = (message: WebSocketMessage) => void;
type StatusListener = (status: ConnectionStatus) => void;

interface IOnlineUsersResponse {
    userIds: string[];
    count: number;
}

class WebSocketManager {
    private socket: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
    private statusListeners: Set<StatusListener> = new Set();
    private _status: ConnectionStatus = 'disconnected';

    get status(): ConnectionStatus {
        return this._status;
    }

    private setStatus(status: ConnectionStatus): void {
        this._status = status;
        this.statusListeners.forEach((listener) => listener(status));
    }

    connect(): void {
        if (typeof window === 'undefined') return;

        const state = store.getState();
        const accessToken = state.auth.tokens?.accessToken;

        if (!accessToken) {
            console.warn('WebSocket: No access token available');
            return;
        }

        if (this.socket?.readyState === WebSocket.OPEN) {
            return;
        }

        if (this.socket?.readyState === WebSocket.CONNECTING) {
            return;
        }

        this.setStatus('connecting');

        const wsUrl = this.getWebSocketUrl(accessToken);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = this.handleOpen.bind(this);
        this.socket.onmessage = this.handleMessage.bind(this);
        this.socket.onclose = this.handleClose.bind(this);
        this.socket.onerror = this.handleError.bind(this);
    }

    disconnect(): void {
        this.stopHeartbeat();
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
        if (this.socket) {
            this.socket.close(1000, 'Client disconnect');
            this.socket = null;
        }
        this.setStatus('disconnected');
        this.reconnectAttempts = 0;
    }

    send(message: WebSocketMessage): void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }

    subscribe(type: string, handler: MessageHandler): () => void {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, new Set());
        }
        this.messageHandlers.get(type)!.add(handler);

        return () => {
            this.messageHandlers.get(type)?.delete(handler);
        };
    }

    onStatusChange(listener: StatusListener): () => void {
        this.statusListeners.add(listener);
        // Immediately notify with current status
        listener(this._status);
        return () => this.statusListeners.delete(listener);
    }

    private getWebSocketUrl(token: string): string {
        const baseUrl =
            process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
        const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
        // Remove /api/v1 from the URL and use the base host
        const wsHost = baseUrl
            .replace(/^https?:\/\//, '')
            .replace(/\/api\/v1$/, '');
        return `${wsProtocol}://${wsHost}/ws?token=${token}`;
    }

    private handleOpen(): void {
        console.log('WebSocket connected');
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const message: WebSocketMessage = JSON.parse(event.data);

            // Handle built-in message types
            this.handleBuiltInMessage(message);

            // Notify subscribers for this specific message type
            const handlers = this.messageHandlers.get(message.type);
            handlers?.forEach((handler) => handler(message));

            // Notify wildcard subscribers
            const wildcardHandlers = this.messageHandlers.get('*');
            wildcardHandlers?.forEach((handler) => handler(message));
        } catch (error) {
            console.error('WebSocket: Failed to parse message', error);
        }
    }

    private handleBuiltInMessage(message: WebSocketMessage): void {
        switch (message.type) {
            case MessageType.USER_ONLINE:
            case MessageType.USER_OFFLINE:
                // Update React Query cache for online users
                this.updateOnlineUsersCache(message);
                break;
            case MessageType.HEARTBEAT:
                // Server acknowledged heartbeat - no action needed
                break;
            case MessageType.CONNECTED:
                console.log('WebSocket: Connection confirmed', message.payload);
                break;
            case MessageType.ERROR:
                console.error('WebSocket error from server:', message.payload);
                break;
        }
    }

    private updateOnlineUsersCache(message: WebSocketMessage): void {
        const { userId } = message.payload as UserPresencePayload;
        const isOnline = message.type === MessageType.USER_ONLINE;

        queryClient.setQueryData<IOnlineUsersResponse>(
            ['presence', 'online'],
            (old) => {
                if (!old) return old;

                const userIds = new Set(old.userIds);
                if (isOnline) {
                    userIds.add(userId);
                } else {
                    userIds.delete(userId);
                }

                return {
                    userIds: Array.from(userIds),
                    count: userIds.size,
                };
            }
        );
    }

    private handleClose(event: CloseEvent): void {
        console.log('WebSocket closed:', event.code, event.reason);
        this.stopHeartbeat();
        this.socket = null;

        // Don't reconnect if closed normally or max attempts reached
        if (
            event.code !== 1000 &&
            this.reconnectAttempts < this.maxReconnectAttempts
        ) {
            this.setStatus('disconnected');
            this.scheduleReconnect();
        } else {
            this.setStatus('disconnected');
        }
    }

    private handleError(event: Event): void {
        console.error('WebSocket error:', event);
        this.setStatus('error');
    }

    private scheduleReconnect(): void {
        this.reconnectAttempts++;
        const delay =
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        console.log(
            `WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
        );
        setTimeout(() => this.connect(), delay);
    }

    private startHeartbeat(): void {
        // Send heartbeat every 4 minutes (server TTL is 5 minutes)
        this.heartbeatInterval = setInterval(
            () => {
                this.send({ type: MessageType.HEARTBEAT, payload: {} });
            },
            4 * 60 * 1000
        );
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
}

export const wsManager = new WebSocketManager();

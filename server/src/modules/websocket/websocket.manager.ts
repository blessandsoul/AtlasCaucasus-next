import { AuthenticatedWebSocket, MessageType } from "./websocket.types.js";
import { logger } from "../../libs/logger.js";
import { presenceService } from "../presence/presence.service.js";

/**
 * WebSocket Connection Manager
 * Manages all active WebSocket connections in memory
 * Supports multiple connections per user (mobile + web + tablet)
 */
class WebSocketManager {
    // Map of userId -> array of WebSocket connections
    private connections: Map<string, AuthenticatedWebSocket[]> = new Map();

    /**
     * Add a new connection for a user
     */
    addConnection(userId: string, ws: AuthenticatedWebSocket): void {
        const userConnections = this.connections.get(userId) || [];
        userConnections.push(ws);
        this.connections.set(userId, userConnections);

        logger.info(
            { userId, connectionId: ws.connectionId, totalConnections: userConnections.length },
            "WebSocket connection added"
        );
    }

    /**
     * Remove a connection for a user
     * If user has no more connections, mark them as offline
     */
    removeConnection(userId: string, connectionId: string): void {
        const userConnections = this.connections.get(userId);

        if (userConnections) {
            const filtered = userConnections.filter(
                (ws) => ws.connectionId !== connectionId
            );

            if (filtered.length === 0) {
                this.connections.delete(userId);
                // User has no more connections, mark as offline
                presenceService.setUserOffline(userId).catch((err) =>
                    logger.error({ err, userId }, "Failed to set user offline")
                );
            } else {
                this.connections.set(userId, filtered);
            }
        }

        logger.info({ userId, connectionId }, "WebSocket connection removed");
    }

    /**
     * Get all connections for a user
     */
    getUserConnections(userId: string): AuthenticatedWebSocket[] {
        return this.connections.get(userId) || [];
    }

    /**
     * Check if user has any active connections
     */
    isUserConnected(userId: string): boolean {
        const connections = this.connections.get(userId);
        return connections !== undefined && connections.length > 0;
    }

    /**
     * Send message to specific user (all their connections)
     */
    sendToUser(userId: string, message: unknown): void {
        const connections = this.getUserConnections(userId);
        const messageStr = JSON.stringify(message);

        connections.forEach((ws) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(messageStr);
            }
        });
    }

    /**
     * Send message to multiple users
     */
    sendToUsers(userIds: string[], message: unknown): void {
        userIds.forEach((userId) => this.sendToUser(userId, message));
    }

    /**
     * Broadcast to all connected users
     */
    broadcast(message: unknown): void {
        const messageStr = JSON.stringify(message);

        this.connections.forEach((connections) => {
            connections.forEach((ws) => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(messageStr);
                }
            });
        });
    }

    /**
     * Broadcast to all users except specified user
     */
    broadcastExcept(userId: string, message: unknown): void {
        const messageStr = JSON.stringify(message);

        this.connections.forEach((connections, connectedUserId) => {
            if (connectedUserId !== userId) {
                connections.forEach((ws) => {
                    if (ws.readyState === ws.OPEN) {
                        ws.send(messageStr);
                    }
                });
            }
        });
    }

    /**
     * Get total connection count
     */
    getConnectionCount(): number {
        let count = 0;
        this.connections.forEach((connections) => {
            count += connections.length;
        });
        return count;
    }

    /**
     * Get online user count
     */
    getOnlineUserCount(): number {
        return this.connections.size;
    }

    /**
     * Get all connected user IDs
     */
    getConnectedUserIds(): string[] {
        return Array.from(this.connections.keys());
    }

    /**
     * Notify users that a user has come online
     */
    notifyUserOnline(userId: string): void {
        this.broadcastExcept(userId, {
            type: MessageType.USER_ONLINE,
            payload: { userId, timestamp: Date.now() },
        });
    }

    /**
     * Notify users that a user has gone offline
     */
    notifyUserOffline(userId: string): void {
        this.broadcast({
            type: MessageType.USER_OFFLINE,
            payload: { userId, timestamp: Date.now() },
        });
    }
}

export const wsManager = new WebSocketManager();

import { FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedWebSocket, MessageType } from "./websocket.types.js";
import { wsManager } from "./websocket.manager.js";
import { presenceService } from "../presence/presence.service.js";
import { logger } from "../../libs/logger.js";
import { env } from "../../config/env.js";
import {
    handleChatMessage,
    handleTyping,
    handleStopTyping,
    handleMarkAsRead,
} from "../chat/chat.websocket.js";

/**
 * Handle incoming WebSocket connections
 * Authenticates the connection using JWT token from query parameter
 * 
 * @fastify/websocket v11+ uses (socket, request) signature instead of SocketStream
 */
export async function handleWebSocketConnection(
    socket: WebSocket,
    request: FastifyRequest
): Promise<void> {
    const ws = socket as AuthenticatedWebSocket;

    try {
        // Extract token from query parameter
        const query = request.query as { token?: string };
        const token = query.token;

        if (!token) {
            ws.close(1008, "Authentication required");
            return;
        }

        // Verify JWT token
        let decoded: { userId?: string };
        try {
            decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as { userId?: string };
        } catch (err) {
            logger.warn({ err }, "WebSocket authentication failed - invalid token");
            ws.close(1008, "Invalid token");
            return;
        }

        if (!decoded.userId) {
            ws.close(1008, "Invalid token payload");
            return;
        }

        // Setup authenticated connection
        ws.userId = decoded.userId;
        ws.connectionId = uuidv4();
        ws.isAlive = true;

        // Add to connection manager
        wsManager.addConnection(ws.userId, ws);

        // Mark user as online in Redis
        await presenceService.setUserOnline(ws.userId, ws.connectionId);

        // Notify other users that this user is online
        wsManager.notifyUserOnline(ws.userId);

        // Send connected confirmation
        ws.send(
            JSON.stringify({
                type: MessageType.CONNECTED,
                payload: {
                    connectionId: ws.connectionId,
                    userId: ws.userId,
                },
            })
        );

        logger.info(
            { userId: ws.userId, connectionId: ws.connectionId },
            "WebSocket authenticated and connected"
        );

        // Handle incoming messages
        ws.on("message", async (data: Buffer) => {
            try {
                const message = JSON.parse(data.toString());
                await handleMessage(ws, message);
            } catch (error) {
                logger.error(
                    { error, userId: ws.userId },
                    "Failed to process WebSocket message"
                );
                ws.send(
                    JSON.stringify({
                        type: MessageType.ERROR,
                        payload: { message: "Invalid message format" },
                    })
                );
            }
        });

        // Handle connection close
        ws.on("close", () => {
            wsManager.removeConnection(ws.userId, ws.connectionId);

            // Check if user has no more connections
            if (!wsManager.isUserConnected(ws.userId)) {
                wsManager.notifyUserOffline(ws.userId);
            }

            logger.info(
                { userId: ws.userId, connectionId: ws.connectionId },
                "WebSocket disconnected"
            );
        });

        // Handle errors
        ws.on("error", (error) => {
            logger.error(
                { error, userId: ws.userId, connectionId: ws.connectionId },
                "WebSocket error"
            );
        });

        // Handle pong (keepalive response)
        ws.on("pong", () => {
            ws.isAlive = true;
        });
    } catch (error) {
        logger.error({ error }, "WebSocket connection handling failed");
        ws.close(1011, "Internal error");
    }
}

/**
 * Handle incoming messages from authenticated connections
 */
async function handleMessage(
    ws: AuthenticatedWebSocket,
    message: { type: string; payload?: unknown }
): Promise<void> {
    const { type, payload } = message;

    switch (type) {
        case MessageType.HEARTBEAT:
            // Refresh user's online status
            await presenceService.heartbeat(ws.userId);
            ws.send(
                JSON.stringify({
                    type: MessageType.HEARTBEAT,
                    payload: { timestamp: Date.now() },
                })
            );
            break;

        // Chat message handlers
        case MessageType.CHAT_MESSAGE:
            await handleChatMessage(ws, payload as any);
            break;

        case MessageType.CHAT_TYPING:
            await handleTyping(ws, payload as any);
            break;

        case MessageType.CHAT_STOP_TYPING:
            await handleStopTyping(ws, payload as any);
            break;

        case MessageType.CHAT_READ:
            await handleMarkAsRead(ws, payload as any);
            break;

        default:
            logger.warn({ type, userId: ws.userId }, "Unknown message type received");
    }
}

// Store interval ID for cleanup
let keepaliveInterval: NodeJS.Timeout | null = null;

/**
 * Start WebSocket keepalive mechanism
 * Pings all connections every 30 seconds to detect dead connections
 */
export function startWebSocketKeepalive(): () => void {
    keepaliveInterval = setInterval(() => {
        const connections = wsManager.getConnectionCount();

        if (connections > 0) {
            logger.debug({ connections }, "Running WebSocket keepalive check");
        }

        // Ping all connections
        wsManager.broadcast({ type: "ping", payload: { timestamp: Date.now() } });
    }, 30000); // Every 30 seconds

    logger.info("WebSocket keepalive started");

    return () => {
        if (keepaliveInterval) {
            clearInterval(keepaliveInterval);
            keepaliveInterval = null;
            logger.info("WebSocket keepalive stopped");
        }
    };
}

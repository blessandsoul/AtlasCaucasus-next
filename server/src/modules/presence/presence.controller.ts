import { FastifyRequest, FastifyReply } from "fastify";
import { presenceService } from "./presence.service.js";
import { successResponse } from "../../libs/response.js";
import { wsManager } from "../websocket/websocket.manager.js";

export class PresenceController {
    /**
     * Get current user's presence status
     * GET /api/v1/presence/me
     */
    async getMyPresence(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const presence = await presenceService.getUserPresence(userId);
        return reply.send(successResponse("Presence retrieved", presence));
    }

    /**
     * Get presence for specific user
     * GET /api/v1/presence/:userId
     */
    async getUserPresence(
        request: FastifyRequest<{ Params: { userId: string } }>,
        reply: FastifyReply
    ) {
        const { userId } = request.params;
        const presence = await presenceService.getUserPresence(userId);
        return reply.send(successResponse("Presence retrieved", presence));
    }

    /**
     * Get presence for multiple users
     * POST /api/v1/presence/multiple
     */
    async getMultiplePresence(
        request: FastifyRequest<{ Body: { userIds: string[] } }>,
        reply: FastifyReply
    ) {
        const { userIds } = request.body;
        const presences = await presenceService.getMultiplePresence(userIds);
        return reply.send(successResponse("Presences retrieved", presences));
    }

    /**
     * Get all online users
     * GET /api/v1/presence/online/all
     */
    async getOnlineUsers(_request: FastifyRequest, reply: FastifyReply) {
        const userIds = await presenceService.getOnlineUsers();
        return reply.send(
            successResponse("Online users retrieved", {
                userIds,
                count: userIds.length,
            })
        );
    }

    /**
     * Get WebSocket connection statistics
     * GET /api/v1/presence/stats
     */
    async getConnectionStats(_request: FastifyRequest, reply: FastifyReply) {
        const connectionCount = wsManager.getConnectionCount();
        const onlineUserCount = wsManager.getOnlineUserCount();
        const onlineUserIds = wsManager.getConnectedUserIds();

        return reply.send(
            successResponse("Connection stats retrieved", {
                totalConnections: connectionCount,
                uniqueUsers: onlineUserCount,
                connectedUserIds: onlineUserIds,
            })
        );
    }
}

export const presenceController = new PresenceController();

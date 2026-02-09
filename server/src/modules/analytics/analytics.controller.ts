import { FastifyRequest, FastifyReply } from "fastify";
import { analyticsService } from "./analytics.service.js";
import { successResponse } from "../../libs/response.js";
import { TrackViewSchema } from "./analytics.schemas.js";

export class AnalyticsController {
    /**
     * GET /api/v1/analytics/me
     * Get analytics overview for the authenticated provider
     */
    async getMyAnalytics(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const roles = request.user.roles;

        const analytics = await analyticsService.getProviderAnalytics(userId, roles);

        return reply.send(successResponse("Analytics retrieved successfully", analytics));
    }

    /**
     * POST /api/v1/analytics/view
     * Track a page view for an entity
     */
    async trackView(request: FastifyRequest, reply: FastifyReply) {
        const body = TrackViewSchema.parse(request.body);

        // userId is optional — unauthenticated users can be tracked too
        const userId = request.user?.id;
        const userAgent = request.headers["user-agent"];

        // Fire-and-forget — don't block the response
        analyticsService.trackView(body.entityType, body.entityId, userId, userAgent).catch(() => {
            // Silently ignore tracking failures
        });

        return reply.status(202).send(successResponse("View tracked", null));
    }
}

export const analyticsController = new AnalyticsController();

import { FastifyInstance } from "fastify";
import { analyticsController } from "./analytics.controller.js";
import { authGuard, requireRole } from "../../middlewares/authGuard.js";

export async function analyticsRoutes(app: FastifyInstance) {
    // GET /analytics/me — provider analytics overview (auth + provider role required)
    app.get(
        "/analytics/me",
        {
            preHandler: [authGuard, requireRole(["COMPANY", "GUIDE", "DRIVER"])],
            config: {
                rateLimit: {
                    max: 30,
                    timeWindow: "1 minute",
                },
            },
        },
        analyticsController.getMyAnalytics.bind(analyticsController)
    );

    // POST /analytics/view — track a page view (optional auth)
    app.post(
        "/analytics/view",
        {
            preHandler: async (request) => {
                // Optional auth: try to extract user, but don't fail if not present
                try {
                    await authGuard(request, {} as never);
                } catch {
                    // Not authenticated — that's fine for view tracking
                }
            },
            config: {
                rateLimit: {
                    max: 120,
                    timeWindow: "1 minute",
                },
            },
        },
        analyticsController.trackView.bind(analyticsController)
    );
}

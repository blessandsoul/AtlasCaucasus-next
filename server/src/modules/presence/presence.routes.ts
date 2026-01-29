import { FastifyInstance } from "fastify";
import { presenceController } from "./presence.controller.js";
import { authGuard } from "../../middlewares/authGuard.js";

export async function presenceRoutes(app: FastifyInstance): Promise<void> {
    // All routes require authentication
    app.addHook("preHandler", authGuard);

    // Get current user's presence
    app.get("/presence/me", presenceController.getMyPresence.bind(presenceController));

    // Get all online users
    app.get("/presence/online/all", presenceController.getOnlineUsers.bind(presenceController));

    // Get connection statistics
    app.get("/presence/stats", presenceController.getConnectionStats.bind(presenceController));

    // Get presence for specific user
    app.get("/presence/:userId", presenceController.getUserPresence.bind(presenceController));

    // Get presence for multiple users
    app.post("/presence/multiple", presenceController.getMultiplePresence.bind(presenceController));
}

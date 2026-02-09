import { FastifyInstance } from "fastify";
import { favoriteController } from "./favorite.controller.js";
import { authGuard } from "../../middlewares/authGuard.js";

export async function favoriteRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook("preHandler", authGuard);

    // Add favorite
    app.post(
        "/favorites",
        {
            config: {
                rateLimit: {
                    max: 60,
                    timeWindow: "1 minute",
                },
            },
        },
        favoriteController.addFavorite.bind(favoriteController)
    );

    // Remove favorite
    app.delete(
        "/favorites/:entityType/:entityId",
        {
            config: {
                rateLimit: {
                    max: 60,
                    timeWindow: "1 minute",
                },
            },
        },
        favoriteController.removeFavorite.bind(favoriteController)
    );

    // List user's favorites
    app.get(
        "/favorites",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        favoriteController.getFavorites.bind(favoriteController)
    );

    // Check if specific entity is favorited
    app.get(
        "/favorites/check",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        favoriteController.checkFavorite.bind(favoriteController)
    );

    // Batch check multiple entities
    app.post(
        "/favorites/check-batch",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        favoriteController.batchCheckFavorites.bind(favoriteController)
    );
}

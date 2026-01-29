import { FastifyInstance } from "fastify";
import { reviewController } from "./review.controller.js";
import { authGuard } from "../../middlewares/authGuard.js";

export async function reviewRoutes(app: FastifyInstance) {
    // ================================
    // PUBLIC ROUTES (no auth required)
    // ================================

    // Get reviews for a target
    app.get(
        "/reviews",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        reviewController.getReviews.bind(reviewController)
    );

    // Get review statistics for a target
    app.get(
        "/reviews/stats",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        reviewController.getReviewStats.bind(reviewController)
    );

    // ================================
    // PROTECTED ROUTES (auth required)
    // ================================

    app.register(async (protectedApp) => {
        protectedApp.addHook("preHandler", authGuard);

        // Create review
        protectedApp.post(
            "/reviews",
            {
                config: {
                    rateLimit: {
                        max: 10,
                        timeWindow: "1 minute",
                    },
                },
            },
            reviewController.createReview.bind(reviewController)
        );

        // Get user's reviews
        protectedApp.get(
            "/reviews/my",
            {
                config: {
                    rateLimit: {
                        max: 100,
                        timeWindow: "1 minute",
                    },
                },
            },
            reviewController.getMyReviews.bind(reviewController)
        );

        // Check if user has reviewed a target
        protectedApp.get(
            "/reviews/check",
            {
                config: {
                    rateLimit: {
                        max: 100,
                        timeWindow: "1 minute",
                    },
                },
            },
            reviewController.checkUserReview.bind(reviewController)
        );

        // Update review
        protectedApp.patch(
            "/reviews/:id",
            {
                config: {
                    rateLimit: {
                        max: 20,
                        timeWindow: "1 minute",
                    },
                },
            },
            reviewController.updateReview.bind(reviewController)
        );

        // Delete review
        protectedApp.delete(
            "/reviews/:id",
            {
                config: {
                    rateLimit: {
                        max: 20,
                        timeWindow: "1 minute",
                    },
                },
            },
            reviewController.deleteReview.bind(reviewController)
        );
    });
}

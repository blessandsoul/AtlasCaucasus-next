import { FastifyRequest, FastifyReply } from "fastify";
import { reviewService } from "./review.service.js";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import {
    CreateReviewSchema,
    UpdateReviewSchema,
    ReviewQuerySchema,
    ReviewStatsQuerySchema,
} from "./review.schemas.js";
import { PaginationSchema } from "../../libs/pagination.js";

export class ReviewController {
    /**
     * POST /api/v1/reviews
     * Create a new review
     */
    async createReview(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const body = CreateReviewSchema.parse(request.body);

        const review = await reviewService.createReview({
            userId,
            ...body,
        });

        return reply.status(201).send(successResponse("Review created successfully", review));
    }

    /**
     * GET /api/v1/reviews
     * Get reviews for a target with pagination
     */
    async getReviews(request: FastifyRequest, reply: FastifyReply) {
        const query = ReviewQuerySchema.parse(request.query);

        const { reviews, total } = await reviewService.getReviews(
            query.targetType,
            query.targetId,
            query.page,
            query.limit,
            query.rating
        );

        return reply.send(
            paginatedResponse(
                "Reviews retrieved successfully",
                reviews,
                query.page,
                query.limit,
                total
            )
        );
    }

    /**
     * GET /api/v1/reviews/stats
     * Get review statistics for a target
     */
    async getReviewStats(request: FastifyRequest, reply: FastifyReply) {
        const query = ReviewStatsQuerySchema.parse(request.query);

        const stats = await reviewService.getReviewStats(
            query.targetType,
            query.targetId
        );

        return reply.send(successResponse("Review stats retrieved successfully", stats));
    }

    /**
     * GET /api/v1/reviews/my
     * Get authenticated user's reviews
     */
    async getMyReviews(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const query = PaginationSchema.parse(request.query);

        const { reviews, total } = await reviewService.getUserReviews(
            userId,
            query.page,
            query.limit
        );

        return reply.send(
            paginatedResponse(
                "Your reviews retrieved successfully",
                reviews,
                query.page,
                query.limit,
                total
            )
        );
    }

    /**
     * GET /api/v1/reviews/check
     * Check if user has reviewed a target
     */
    async checkUserReview(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const query = ReviewStatsQuerySchema.parse(request.query);

        const review = await reviewService.getUserReviewForTarget(
            userId,
            query.targetType,
            query.targetId
        );

        return reply.send(successResponse("Review check complete", {
            hasReviewed: !!review,
            review: review || null,
        }));
    }

    /**
     * PATCH /api/v1/reviews/:id
     * Update user's review
     */
    async updateReview(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const { id } = request.params;
        const body = UpdateReviewSchema.parse(request.body);

        const review = await reviewService.updateReview(id, userId, body);

        return reply.send(successResponse("Review updated successfully", review));
    }

    /**
     * DELETE /api/v1/reviews/:id
     * Delete user's review
     */
    async deleteReview(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const { id } = request.params;

        await reviewService.deleteReview(id, userId);

        return reply.send(successResponse("Review deleted successfully", null));
    }
}

export const reviewController = new ReviewController();

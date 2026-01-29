import { reviewRepo } from "./review.repo.js";
import { ReviewTargetType } from "@prisma/client";
import {
    BadRequestError,
    NotFoundError,
    ForbiddenError,
} from "../../libs/errors.js";
import { prisma } from "../../libs/prisma.js";
import { notificationService } from "../notifications/notification.service.js";
import { logger } from "../../libs/logger.js";
import { CreateReviewData, UpdateReviewData } from "./review.types.js";

export class ReviewService {
    /**
     * Create a new review
     */
    async createReview(data: CreateReviewData) {
        // Check if user's email is verified
        const user = await prisma.user.findUnique({
            where: { id: data.userId },
            select: { emailVerified: true, firstName: true, lastName: true },
        });

        if (!user?.emailVerified) {
            throw new ForbiddenError("Email must be verified to leave reviews");
        }

        // Verify target exists
        await this.verifyTargetExists(data.targetType, data.targetId);

        // Check if user already reviewed this target
        const existing = await reviewRepo.findByUserAndTarget(
            data.userId,
            data.targetType,
            data.targetId
        );

        if (existing) {
            throw new BadRequestError("You have already reviewed this item. You can update your existing review.");
        }

        // Create review
        const review = await reviewRepo.create(data);

        // Update target's average rating
        await this.recalculateRating(data.targetType, data.targetId);

        // Send notification to owner
        await this.notifyOwner(
            data.targetType,
            data.targetId,
            `${user.firstName} ${user.lastName}`,
            data.rating
        );

        logger.info(
            { reviewId: review.id, targetType: data.targetType, targetId: data.targetId },
            "Review created"
        );

        return review;
    }

    /**
     * Get reviews for a target with pagination
     */
    async getReviews(
        targetType: ReviewTargetType,
        targetId: string,
        page: number,
        limit: number,
        rating?: number
    ) {
        // Verify target exists
        await this.verifyTargetExists(targetType, targetId);

        return reviewRepo.findByTarget(targetType, targetId, page, limit, rating);
    }

    /**
     * Get review statistics
     */
    async getReviewStats(targetType: ReviewTargetType, targetId: string) {
        // Verify target exists
        await this.verifyTargetExists(targetType, targetId);

        return reviewRepo.getStats(targetType, targetId);
    }

    /**
     * Get user's reviews with pagination
     */
    async getUserReviews(userId: string, page: number, limit: number) {
        return reviewRepo.findByUser(userId, page, limit);
    }

    /**
     * Get a specific user's review for a target
     */
    async getUserReviewForTarget(
        userId: string,
        targetType: ReviewTargetType,
        targetId: string
    ) {
        return reviewRepo.findByUserAndTarget(userId, targetType, targetId);
    }

    /**
     * Update a review
     */
    async updateReview(reviewId: string, userId: string, data: UpdateReviewData) {
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundError("Review not found");
        }

        // Authorization: Only review author can update
        if (review.userId !== userId) {
            throw new ForbiddenError("You can only update your own reviews");
        }

        // Update review
        const updated = await reviewRepo.update(reviewId, data);

        // Recalculate rating if rating changed
        if (data.rating !== undefined) {
            await this.recalculateRating(review.targetType, review.targetId);
        }

        logger.info({ reviewId }, "Review updated");

        return updated;
    }

    /**
     * Delete a review
     */
    async deleteReview(reviewId: string, userId: string) {
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundError("Review not found");
        }

        // Authorization: Only review author can delete
        if (review.userId !== userId) {
            throw new ForbiddenError("You can only delete your own reviews");
        }

        const { targetType, targetId } = review;

        // Delete review
        await reviewRepo.delete(reviewId);

        // Recalculate rating
        await this.recalculateRating(targetType, targetId);

        logger.info({ reviewId }, "Review deleted");
    }

    /**
     * Verify target entity exists
     */
    private async verifyTargetExists(
        targetType: ReviewTargetType,
        targetId: string
    ) {
        let exists = false;

        switch (targetType) {
            case "TOUR":
                exists = !!(await prisma.tour.findUnique({ where: { id: targetId } }));
                break;
            case "GUIDE":
                exists = !!(await prisma.guide.findUnique({ where: { id: targetId } }));
                break;
            case "DRIVER":
                exists = !!(await prisma.driver.findUnique({ where: { id: targetId } }));
                break;
            case "COMPANY":
                exists = !!(await prisma.company.findUnique({ where: { id: targetId } }));
                break;
        }

        if (!exists) {
            throw new NotFoundError(`${targetType} not found`);
        }
    }

    /**
     * Recalculate and update average rating for a target
     */
    private async recalculateRating(
        targetType: ReviewTargetType,
        targetId: string
    ) {
        const stats = await reviewRepo.getStats(targetType, targetId);

        await reviewRepo.updateTargetRating(
            targetType,
            targetId,
            stats.averageRating,
            stats.reviewCount
        );

        logger.debug(
            { targetType, targetId, averageRating: stats.averageRating, reviewCount: stats.reviewCount },
            "Rating recalculated"
        );
    }

    /**
     * Notify target owner of new review
     */
    private async notifyOwner(
        targetType: ReviewTargetType,
        targetId: string,
        reviewerName: string,
        rating: number
    ) {
        try {
            let ownerId: string | null = null;
            let entityName: string = "";

            switch (targetType) {
                case "TOUR":
                    const tour = await prisma.tour.findUnique({
                        where: { id: targetId },
                        select: { ownerId: true, title: true },
                    });
                    ownerId = tour?.ownerId || null;
                    entityName = tour?.title || "your tour";
                    break;

                case "GUIDE":
                    const guide = await prisma.guide.findUnique({
                        where: { id: targetId },
                        select: { userId: true },
                    });
                    ownerId = guide?.userId || null;
                    entityName = "your guide profile";
                    break;

                case "DRIVER":
                    const driver = await prisma.driver.findUnique({
                        where: { id: targetId },
                        select: { userId: true },
                    });
                    ownerId = driver?.userId || null;
                    entityName = "your driver profile";
                    break;

                case "COMPANY":
                    const company = await prisma.company.findUnique({
                        where: { id: targetId },
                        select: { userId: true, companyName: true },
                    });
                    ownerId = company?.userId || null;
                    entityName = company?.companyName || "your company";
                    break;
            }

            if (ownerId) {
                const stars = "⭐".repeat(rating);
                await notificationService.createNotification({
                    userId: ownerId,
                    type: "SYSTEM",
                    title: "New Review Received",
                    message: `${reviewerName} left a ${rating}-star review ${stars} for ${entityName}`,
                    data: {
                        type: "NEW_REVIEW",
                        targetType,
                        targetId,
                        rating,
                    },
                });
            }
        } catch (error) {
            // Don't fail the main operation if notification fails
            logger.error({ error, targetType, targetId }, "Failed to notify owner of review");
        }
    }
}

export const reviewService = new ReviewService();

import { prisma } from "../../libs/prisma.js";
import { ReviewTargetType } from "@prisma/client";
import { CreateReviewData, UpdateReviewData } from "./review.types.js";

const userSelect = {
    id: true,
    firstName: true,
    lastName: true,
};

export class ReviewRepository {
    /**
     * Create a new review
     */
    async create(data: CreateReviewData) {
        return prisma.review.create({
            data: {
                userId: data.userId,
                targetType: data.targetType,
                targetId: data.targetId,
                rating: data.rating,
                comment: data.comment,
            },
            include: {
                user: {
                    select: userSelect,
                },
            },
        });
    }

    /**
     * Find review by ID
     */
    async findById(reviewId: string) {
        return prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                user: {
                    select: userSelect,
                },
            },
        });
    }

    /**
     * Find review by user and target (for duplicate check)
     */
    async findByUserAndTarget(
        userId: string,
        targetType: ReviewTargetType,
        targetId: string
    ) {
        return prisma.review.findUnique({
            where: {
                user_target_unique: {
                    userId,
                    targetType,
                    targetId,
                },
            },
            include: {
                user: {
                    select: userSelect,
                },
            },
        });
    }

    /**
     * Get reviews for a target with pagination
     */
    async findByTarget(
        targetType: ReviewTargetType,
        targetId: string,
        page: number,
        limit: number,
        rating?: number
    ) {
        const skip = (page - 1) * limit;
        const whereClause: any = {
            targetType,
            targetId,
        };

        if (rating !== undefined) {
            whereClause.rating = rating;
        }

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: userSelect,
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.review.count({ where: whereClause }),
        ]);

        return { reviews, total };
    }

    /**
     * Get user's reviews with pagination
     */
    async findByUser(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: { userId },
                include: {
                    user: {
                        select: userSelect,
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.review.count({ where: { userId } }),
        ]);

        return { reviews, total };
    }

    /**
     * Update a review
     */
    async update(reviewId: string, data: UpdateReviewData) {
        return prisma.review.update({
            where: { id: reviewId },
            data,
            include: {
                user: {
                    select: userSelect,
                },
            },
        });
    }

    /**
     * Delete a review
     */
    async delete(reviewId: string) {
        return prisma.review.delete({
            where: { id: reviewId },
        });
    }

    /**
     * Get review statistics for a target
     */
    async getStats(targetType: ReviewTargetType, targetId: string) {
        const reviews = await prisma.review.findMany({
            where: { targetType, targetId },
            select: { rating: true },
        });

        if (reviews.length === 0) {
            return {
                averageRating: 0,
                reviewCount: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };
        }

        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / reviews.length;

        const ratingDistribution = {
            1: reviews.filter((r) => r.rating === 1).length,
            2: reviews.filter((r) => r.rating === 2).length,
            3: reviews.filter((r) => r.rating === 3).length,
            4: reviews.filter((r) => r.rating === 4).length,
            5: reviews.filter((r) => r.rating === 5).length,
        };

        return {
            averageRating,
            reviewCount: reviews.length,
            ratingDistribution,
        };
    }

    /**
     * Update target's average rating and review count
     */
    async updateTargetRating(
        targetType: ReviewTargetType,
        targetId: string,
        averageRating: number,
        reviewCount: number
    ) {
        // Round to 2 decimal places
        const roundedRating = reviewCount > 0
            ? Math.round(averageRating * 100) / 100
            : null;

        switch (targetType) {
            case "TOUR":
                return prisma.tour.update({
                    where: { id: targetId },
                    data: { averageRating: roundedRating, reviewCount },
                });

            case "GUIDE":
                return prisma.guide.update({
                    where: { id: targetId },
                    data: { averageRating: roundedRating, reviewCount },
                });

            case "DRIVER":
                return prisma.driver.update({
                    where: { id: targetId },
                    data: { averageRating: roundedRating, reviewCount },
                });

            case "COMPANY":
                return prisma.company.update({
                    where: { id: targetId },
                    data: { averageRating: roundedRating, reviewCount },
                });
        }
    }
}

export const reviewRepo = new ReviewRepository();

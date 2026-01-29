import { z } from "zod";
import { ReviewTargetType } from "@prisma/client";

/**
 * Schema for creating a review
 */
export const CreateReviewSchema = z.object({
    targetType: z.nativeEnum(ReviewTargetType),
    targetId: z.string().uuid(),
    rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
    comment: z
        .string()
        .min(10, "Comment must be at least 10 characters")
        .max(1000, "Comment too long")
        .optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

/**
 * Schema for updating a review
 */
export const UpdateReviewSchema = z
    .object({
        rating: z.number().int().min(1).max(5).optional(),
        comment: z.string().min(10).max(1000).optional(),
    })
    .refine((data) => data.rating !== undefined || data.comment !== undefined, {
        message: "At least one field (rating or comment) must be provided",
    });

export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;

/**
 * Schema for querying reviews for a target
 */
export const ReviewQuerySchema = z.object({
    targetType: z.nativeEnum(ReviewTargetType),
    targetId: z.string().uuid(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    rating: z.coerce.number().int().min(1).max(5).optional(), // Filter by specific rating
});

export type ReviewQueryInput = z.infer<typeof ReviewQuerySchema>;

/**
 * Schema for review stats query
 */
export const ReviewStatsQuerySchema = z.object({
    targetType: z.nativeEnum(ReviewTargetType),
    targetId: z.string().uuid(),
});

export type ReviewStatsQueryInput = z.infer<typeof ReviewStatsQuerySchema>;

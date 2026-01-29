import { ReviewTargetType } from "@prisma/client";

export interface ReviewResponse {
    id: string;
    userId: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
    };
    targetType: ReviewTargetType;
    targetId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateReviewData {
    userId: string;
    targetType: ReviewTargetType;
    targetId: string;
    rating: number;
    comment?: string;
}

export interface UpdateReviewData {
    rating?: number;
    comment?: string;
}

export interface ReviewStats {
    averageRating: number;
    reviewCount: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

/**
 * Review Target Types - entities that can be reviewed
 */
export type ReviewTargetType = 'TOUR' | 'GUIDE' | 'DRIVER' | 'COMPANY';

/**
 * Author information included with reviews
 */
export interface ReviewUser {
  id: string;
  firstName: string;
  lastName: string;
}

/**
 * Review entity from the API
 */
export interface Review {
  id: string;
  userId: string;
  user: ReviewUser;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Rating distribution for review statistics
 */
export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

/**
 * Review statistics for a target
 */
export interface ReviewStatsData {
  averageRating: number | null;
  reviewCount: number;
  ratingDistribution: RatingDistribution;
}

/**
 * Request payload for creating a review
 */
export interface CreateReviewRequest {
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment?: string;
}

/**
 * Request payload for updating a review
 */
export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

/**
 * Query parameters for fetching reviews
 */
export interface ReviewFilters {
  targetType: ReviewTargetType;
  targetId: string;
  page?: number;
  limit?: number;
  rating?: number;
}

/**
 * Query parameters for fetching user's reviews
 */
export interface MyReviewsParams {
  page?: number;
  limit?: number;
}

/**
 * Response from the check has reviewed endpoint
 */
export interface HasReviewedResponse {
  hasReviewed: boolean;
  review: Review | null;
}

/**
 * Paginated reviews response structure
 */
export interface ReviewsResponse {
  items: Review[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
  Review,
  ReviewStatsData,
  ReviewsResponse,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewFilters,
  MyReviewsParams,
  HasReviewedResponse,
  ReviewTargetType,
} from '../types/review.types';

class ReviewService {
  /**
   * Get reviews for a specific target (tour, guide, driver, company)
   */
  async getReviews(filters: ReviewFilters) {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: ReviewsResponse;
    }>(API_ENDPOINTS.REVIEWS.LIST, { params: filters });

    return response.data.data;
  }

  /**
   * Get review statistics for a target
   */
  async getReviewStats(targetType: ReviewTargetType, targetId: string) {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: ReviewStatsData;
    }>(API_ENDPOINTS.REVIEWS.STATS, {
      params: { targetType, targetId },
    });

    return response.data.data;
  }

  /**
   * Create a new review
   */
  async createReview(data: CreateReviewRequest) {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: Review;
    }>(API_ENDPOINTS.REVIEWS.CREATE, data);

    return response.data.data;
  }

  /**
   * Get current user's reviews
   */
  async getMyReviews(params: MyReviewsParams = {}) {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: ReviewsResponse;
    }>(API_ENDPOINTS.REVIEWS.MY_REVIEWS, { params });

    return response.data.data;
  }

  /**
   * Check if current user has reviewed a target
   */
  async checkHasReviewed(targetType: ReviewTargetType, targetId: string) {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: HasReviewedResponse;
    }>(API_ENDPOINTS.REVIEWS.CHECK, {
      params: { targetType, targetId },
    });

    return response.data.data;
  }

  /**
   * Update an existing review
   */
  async updateReview(id: string, data: UpdateReviewRequest) {
    const response = await apiClient.patch<{
      success: boolean;
      message: string;
      data: Review;
    }>(API_ENDPOINTS.REVIEWS.UPDATE(id), data);

    return response.data.data;
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string) {
    await apiClient.delete(API_ENDPOINTS.REVIEWS.DELETE(id));
  }
}

export const reviewService = new ReviewService();

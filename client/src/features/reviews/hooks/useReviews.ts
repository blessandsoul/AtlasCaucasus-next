'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { reviewService } from '../services/review.service';
import { getErrorMessage } from '@/lib/utils/error';
import type {
  ReviewFilters,
  MyReviewsParams,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewTargetType,
} from '../types/review.types';

/**
 * Fetch reviews for a specific target (tour, guide, driver, company)
 */
export const useReviews = (filters: ReviewFilters) => {
  return useQuery({
    queryKey: ['reviews', filters],
    queryFn: () => reviewService.getReviews(filters),
    enabled: !!filters.targetType && !!filters.targetId,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

/**
 * Fetch review statistics for a target
 */
export const useReviewStats = (targetType: ReviewTargetType, targetId: string) => {
  return useQuery({
    queryKey: ['reviewStats', targetType, targetId],
    queryFn: () => reviewService.getReviewStats(targetType, targetId),
    enabled: !!targetType && !!targetId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch current user's reviews
 */
export const useMyReviews = (params: MyReviewsParams = {}) => {
  return useQuery({
    queryKey: ['myReviews', params],
    queryFn: () => reviewService.getMyReviews(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

/**
 * Check if current user has reviewed a target
 */
export const useHasReviewed = (
  targetType: ReviewTargetType,
  targetId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['hasReviewed', targetType, targetId],
    queryFn: () => reviewService.checkHasReviewed(targetType, targetId),
    enabled: enabled && !!targetType && !!targetId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create a new review
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateReviewRequest) => reviewService.createReview(data),
    onSuccess: (review) => {
      // Invalidate reviews list for this target
      queryClient.invalidateQueries({
        queryKey: ['reviews', { targetType: review.targetType, targetId: review.targetId }],
      });
      // Invalidate stats for this target
      queryClient.invalidateQueries({
        queryKey: ['reviewStats', review.targetType, review.targetId],
      });
      // Invalidate hasReviewed check
      queryClient.invalidateQueries({
        queryKey: ['hasReviewed', review.targetType, review.targetId],
      });
      // Invalidate user's reviews
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      toast.success(t('reviews.create_success', 'Review submitted successfully!'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Update an existing review
 */
export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReviewRequest }) =>
      reviewService.updateReview(id, data),
    onSuccess: (review) => {
      // Invalidate reviews list for this target
      queryClient.invalidateQueries({
        queryKey: ['reviews', { targetType: review.targetType, targetId: review.targetId }],
      });
      // Invalidate stats for this target (rating may have changed)
      queryClient.invalidateQueries({
        queryKey: ['reviewStats', review.targetType, review.targetId],
      });
      // Invalidate hasReviewed check
      queryClient.invalidateQueries({
        queryKey: ['hasReviewed', review.targetType, review.targetId],
      });
      // Invalidate user's reviews
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      toast.success(t('reviews.update_success', 'Review updated successfully!'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Delete a review
 */
export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      id,
    }: {
      id: string;
      targetType: ReviewTargetType;
      targetId: string;
    }) => reviewService.deleteReview(id),
    onSuccess: (_, { targetType, targetId }) => {
      // Invalidate reviews list for this target
      queryClient.invalidateQueries({
        queryKey: ['reviews', { targetType, targetId }],
      });
      // Invalidate stats for this target
      queryClient.invalidateQueries({
        queryKey: ['reviewStats', targetType, targetId],
      });
      // Invalidate hasReviewed check
      queryClient.invalidateQueries({
        queryKey: ['hasReviewed', targetType, targetId],
      });
      // Invalidate user's reviews
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      toast.success(t('reviews.delete_success', 'Review deleted successfully!'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

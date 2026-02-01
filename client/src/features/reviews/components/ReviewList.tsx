'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useReviews } from '../hooks/useReviews';
import { ReviewCard } from './ReviewCard';
import { cn } from '@/lib/utils';
import type { ReviewTargetType, Review } from '../types/review.types';

interface ReviewListProps {
  targetType: ReviewTargetType;
  targetId: string;
  limit?: number;
  currentUserId?: string;
  onEditReview?: (review: Review) => void;
  onDeleteReview?: (review: Review) => void;
  isDeletingId?: string;
  className?: string;
}

export const ReviewList = ({
  targetType,
  targetId,
  limit = 10,
  currentUserId,
  onEditReview,
  onDeleteReview,
  isDeletingId,
  className,
}: ReviewListProps) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useReviews({
    targetType,
    targetId,
    page,
    limit,
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-4">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        {t('reviews.load_error', 'Failed to load reviews')}
      </div>
    );
  }

  const reviews = data?.items ?? [];
  const pagination = data?.pagination;

  if (reviews.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          {t('reviews.no_reviews', 'No reviews yet. Be the first to leave a review!')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {/* Reviews list */}
      <div className="divide-y">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            showActions={currentUserId === review.userId}
            onEdit={onEditReview}
            onDelete={onDeleteReview}
            isDeleting={isDeletingId === review.id}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={!pagination.hasPreviousPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('common.previous', 'Previous')}
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            {t('common.page_of', 'Page {{current}} of {{total}}', {
              current: pagination.page,
              total: pagination.totalPages,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNextPage}
          >
            {t('common.next', 'Next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

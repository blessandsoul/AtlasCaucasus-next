'use client';

import { useTranslation } from 'react-i18next';
import { useReviewStats } from '../hooks/useReviews';
import { StarRating } from './StarRating';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ReviewTargetType } from '../types/review.types';

interface ReviewStatsProps {
  targetType: ReviewTargetType;
  targetId: string;
  showDistribution?: boolean;
  className?: string;
}

interface RatingBarProps {
  rating: number;
  count: number;
  total: number;
}

const RatingBar = ({ rating, count, total }: RatingBarProps) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-muted-foreground">{rating}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-muted-foreground text-xs">{count}</span>
    </div>
  );
};

export const ReviewStats = ({
  targetType,
  targetId,
  showDistribution = false,
  className,
}: ReviewStatsProps) => {
  const { t } = useTranslation();
  const { data: stats, isLoading, error } = useReviewStats(targetType, targetId);

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        {showDistribution && (
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((n) => (
              <Skeleton key={n} className="h-4 w-full" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (error || !stats) {
    return null;
  }

  const { averageRating, reviewCount, ratingDistribution } = stats;

  if (reviewCount === 0) {
    return (
      <div className={cn('text-muted-foreground text-sm', className)}>
        {t('reviews.no_reviews_yet')}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary */}
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold">
          {averageRating?.toFixed(1) ?? '-'}
        </span>
        <div className="flex flex-col">
          <StarRating rating={averageRating ?? 0} size="md" />
          <span className="text-sm text-muted-foreground">
            {t('reviews.review_count', { count: reviewCount })}
          </span>
        </div>
      </div>

      {/* Distribution */}
      {showDistribution && ratingDistribution && (
        <div className="space-y-1">
          {([5, 4, 3, 2, 1] as const).map((rating) => (
            <RatingBar
              key={rating}
              rating={rating}
              count={ratingDistribution[rating] || 0}
              total={reviewCount}
            />
          ))}
        </div>
      )}
    </div>
  );
};

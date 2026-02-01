'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useMyReviews, useDeleteReview } from '../hooks/useReviews';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { cn } from '@/lib/utils';
import type { Review, ReviewTargetType } from '../types/review.types';

interface MyReviewsProps {
  limit?: number;
  className?: string;
}

const targetTypeLabels: Record<ReviewTargetType, string> = {
  TOUR: 'Tour',
  GUIDE: 'Guide',
  DRIVER: 'Driver',
  COMPANY: 'Company',
};

const targetTypeRoutes: Record<ReviewTargetType, string> = {
  TOUR: '/explore/tours',
  GUIDE: '/explore/guides',
  DRIVER: '/explore/drivers',
  COMPANY: '/explore/companies',
};

export const MyReviews = ({ limit = 10, className }: MyReviewsProps) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, error } = useMyReviews({ page, limit });
  const deleteReview = useDeleteReview();

  const handleEdit = (review: Review) => {
    setEditingReview(review);
  };

  const handleDelete = (review: Review) => {
    setDeletingId(review.id);
    deleteReview.mutate(
      {
        id: review.id,
        targetType: review.targetType,
        targetId: review.targetId,
      },
      {
        onSettled: () => {
          setDeletingId(null);
        },
      }
    );
  };

  const handleEditSuccess = () => {
    setEditingReview(null);
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-4 border-b">
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
        <p className="text-muted-foreground mb-4">
          {t('reviews.no_my_reviews', "You haven't written any reviews yet.")}
        </p>
        <Button asChild variant="outline">
          <Link href="/explore/tours">
            {t('reviews.explore_tours', 'Explore Tours')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={cn('space-y-0', className)}>
        {/* Reviews list */}
        <div className="divide-y">
          {reviews.map((review) => (
            <div key={review.id} className="relative">
              {/* Target info badge */}
              <div className="pt-4 pb-0">
                <Link
                  href={`${targetTypeRoutes[review.targetType]}/${review.targetId}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Badge variant="secondary" className="text-xs">
                    {targetTypeLabels[review.targetType]}
                  </Badge>
                  <span className="hover:underline">
                    {t('reviews.view_reviewed_item', 'View reviewed item')}
                  </span>
                </Link>
              </div>

              <ReviewCard
                review={review}
                showActions
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={deletingId === review.id}
              />
            </div>
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

      {/* Edit review dialog */}
      <Dialog open={!!editingReview} onOpenChange={(open) => !open && setEditingReview(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {t('reviews.edit_title', 'Edit Your Review')}
            </DialogTitle>
            <DialogDescription>
              {t('reviews.edit_description', 'Update your rating and comment below.')}
            </DialogDescription>
          </DialogHeader>
          {editingReview && (
            <ReviewForm
              targetType={editingReview.targetType}
              targetId={editingReview.targetId}
              existingReview={editingReview}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingReview(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

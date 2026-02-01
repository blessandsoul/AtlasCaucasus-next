'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReviewStats } from './ReviewStats';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';
import { useHasReviewed, useDeleteReview } from '../hooks/useReviews';
import { cn } from '@/lib/utils';
import type { ReviewTargetType, Review } from '../types/review.types';

interface ReviewsSectionProps {
  targetType: ReviewTargetType;
  targetId: string;
  className?: string;
}

export const ReviewsSection = ({
  targetType,
  targetId,
  className,
}: ReviewsSectionProps) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showWriteReview, setShowWriteReview] = useState(false);

  const { data: hasReviewedData, isLoading: checkingReview } = useHasReviewed(
    targetType,
    targetId,
    isAuthenticated
  );

  const deleteReview = useDeleteReview();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasReviewed = hasReviewedData?.hasReviewed ?? false;
  const existingReview = hasReviewedData?.review ?? null;

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
  };

  const handleDeleteReview = (review: Review) => {
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

  const handleReviewSuccess = () => {
    setShowWriteReview(false);
    setEditingReview(null);
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>{t('reviews.section_title', 'Reviews')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <ReviewStats
          targetType={targetType}
          targetId={targetId}
          showDistribution
        />

        <Separator />

        {/* Write Review Button / Form */}
        {isAuthenticated && !checkingReview && (
          <div>
            {hasReviewed && existingReview ? (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {t('reviews.already_reviewed', 'You have already reviewed this item.')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingReview(existingReview)}
                >
                  {t('reviews.edit_your_review', 'Edit Your Review')}
                </Button>
              </div>
            ) : (
              <div>
                {showWriteReview ? (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-4">
                      {t('reviews.write_review', 'Write a Review')}
                    </h4>
                    <ReviewForm
                      targetType={targetType}
                      targetId={targetId}
                      onSuccess={handleReviewSuccess}
                      onCancel={() => setShowWriteReview(false)}
                    />
                  </div>
                ) : (
                  <Button onClick={() => setShowWriteReview(true)}>
                    {t('reviews.write_review', 'Write a Review')}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground">
            {t('reviews.login_to_review', 'Please log in to write a review.')}
          </p>
        )}

        <Separator />

        {/* Reviews List */}
        <ReviewList
          targetType={targetType}
          targetId={targetId}
          currentUserId={user?.id}
          onEditReview={handleEditReview}
          onDeleteReview={handleDeleteReview}
          isDeletingId={deletingId ?? undefined}
        />
      </CardContent>

      {/* Edit Review Dialog */}
      <Dialog
        open={!!editingReview}
        onOpenChange={(open) => !open && setEditingReview(null)}
      >
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
              onSuccess={handleReviewSuccess}
              onCancel={() => setEditingReview(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

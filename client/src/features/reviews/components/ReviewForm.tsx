'use client';

import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { StarRating } from './StarRating';
import { useCreateReview, useUpdateReview } from '../hooks/useReviews';
import { cn } from '@/lib/utils';
import type { Review, ReviewTargetType } from '../types/review.types';

interface ReviewFormProps {
  targetType: ReviewTargetType;
  targetId: string;
  existingReview?: Review;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const ReviewForm = ({
  targetType,
  targetId,
  existingReview,
  onSuccess,
  onCancel,
  className,
}: ReviewFormProps) => {
  const { t } = useTranslation();
  const isEditing = !!existingReview;

  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  const isSubmitting = createReview.isPending || updateReview.isPending;

  // Define schema inside component to use translations
  const reviewSchema = useMemo(
    () =>
      z.object({
        rating: z
          .number()
          .min(1, t('reviews.validation.rating_required'))
          .max(5),
        comment: z
          .string()
          .min(10, t('reviews.validation.comment_min'))
          .max(1000, t('reviews.validation.comment_max'))
          .optional()
          .or(z.literal('')),
      }),
    [t]
  );

  type ReviewFormData = z.infer<typeof reviewSchema>;

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating ?? 0,
      comment: existingReview?.comment ?? '',
    },
  });

  // Reset form when existingReview changes
  useEffect(() => {
    if (existingReview) {
      form.reset({
        rating: existingReview.rating,
        comment: existingReview.comment ?? '',
      });
    }
  }, [existingReview, form]);

  const onSubmit = async (data: ReviewFormData) => {
    const payload = {
      rating: data.rating,
      comment: data.comment && data.comment.length >= 10 ? data.comment : undefined,
    };

    if (isEditing && existingReview) {
      updateReview.mutate(
        { id: existingReview.id, data: payload },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        }
      );
    } else {
      createReview.mutate(
        { targetType, targetId, ...payload },
        {
          onSuccess: () => {
            form.reset({ rating: 0, comment: '' });
            onSuccess?.();
          },
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
      >
        {/* Rating */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('reviews.rating_label')} *
              </FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <StarRating
                    rating={field.value}
                    size="lg"
                    interactive
                    onChange={field.onChange}
                  />
                  {field.value > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {field.value} / 5
                    </span>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Comment */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('reviews.comment_label')}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t(
                    'reviews.comment_placeholder'
                  )}
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length ?? 0} / 1000
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing
              ? t('reviews.update_button')
              : t('reviews.submit_button')}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

'use client';

import { MapPin, Star, Pencil } from 'lucide-react';
import type { Tour } from '@/features/tours/types/tour.types';
import { ShareButton } from '@/components/common/ShareButton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TourHeaderProps {
  tour: Tour;
  className?: string;
  onReviewsClick?: () => void;
}

export const TourHeader = ({ tour, className, onReviewsClick }: TourHeaderProps): React.ReactElement => {
  const rating = tour.averageRating ? parseFloat(tour.averageRating) : null;
  const reviewCount = tour.reviewCount || 0;

  return (
    <div className={cn('space-y-3', className)}>
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground [text-wrap:balance]">
        {tour.title}
      </h1>

      <div className="flex flex-wrap items-center justify-between gap-y-2">
        {/* Left: rating + location */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {/* Rating cluster */}
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-foreground">
              {rating ? rating.toFixed(1) : 'New'}
            </span>
            <button
              type="button"
              onClick={onReviewsClick}
              className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </button>
          </div>

          {/* Vertical divider + location */}
          {tour.city && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{tour.city}, Georgia</span>
              </div>
            </>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full text-sm"
            onClick={onReviewsClick}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Write a review</span>
          </Button>
          <ShareButton
            url={`/explore/tours/${tour.id}`}
            title={tour.title}
            description={tour.summary || undefined}
            variant="default"
          />
        </div>
      </div>
    </div>
  );
};

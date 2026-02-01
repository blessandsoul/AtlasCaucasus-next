'use client';

import { MapPin, Star } from 'lucide-react';
import type { Tour } from '@/features/tours/types/tour.types';
import { cn } from '@/lib/utils';

interface TourHeaderProps {
  tour: Tour;
  className?: string;
}

export const TourHeader = ({ tour, className }: TourHeaderProps) => {
  const rating = tour.averageRating ? parseFloat(tour.averageRating) : null;
  const reviewCount = tour.reviewCount || 0;

  return (
    <div className={cn('space-y-4', className)}>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
        {tour.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {tour.city && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{tour.city}, Georgia</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium text-foreground">
            {rating ? rating.toFixed(1) : 'New'}
          </span>
          <span>
            ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>
    </div>
  );
};

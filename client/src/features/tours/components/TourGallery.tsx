'use client';

import type { TourImage } from '@/features/tours/types/tour.types';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';
import { getMediaUrl } from '@/lib/utils/media';

interface TourGalleryProps {
  images?: TourImage[];
  className?: string;
}

export const TourGallery = ({ images = [], className }: TourGalleryProps) => {
  if (!images || images.length === 0) {
    return (
      <div
        className={cn(
          'w-full h-[400px] bg-muted rounded-xl flex items-center justify-center',
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageOff className="h-10 w-10" />
          <span>No images available</span>
        </div>
      </div>
    );
  }

  const hasGrid = images.length >= 5;
  const displayImages = images.slice(0, 5);

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'grid gap-2 md:gap-4',
          hasGrid
            ? 'grid-cols-4 grid-rows-2 h-[300px] md:h-[500px]'
            : 'grid-cols-1 h-[400px]'
        )}
      >
        {displayImages.map((img, index) => (
          <div
            key={img.id || index}
            className={cn(
              'relative overflow-hidden rounded-lg bg-muted',
              hasGrid && index === 0
                ? 'col-span-2 row-span-2'
                : 'col-span-1 row-span-1',
              !hasGrid && 'h-full w-full'
            )}
          >
            <img
              src={getMediaUrl(img.url)}
              alt={img.altText || `Tour image ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        ))}
      </div>

      {images.length > 5 && (
        <div className="mt-2 flex justify-end">
          <button className="text-sm font-medium text-primary hover:underline">
            Show all {images.length} photos
          </button>
        </div>
      )}
    </div>
  );
};

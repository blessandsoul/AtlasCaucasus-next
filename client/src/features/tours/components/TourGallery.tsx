'use client';

import { useState } from 'react';
import type { TourImage } from '@/features/tours/types/tour.types';
import { cn } from '@/lib/utils';
import { ImageOff, Grid } from 'lucide-react';
import { getMediaUrl } from '@/lib/utils/media';
import { Button } from '@/components/ui/button';
import { TourLightbox } from './TourLightbox';

interface TourGalleryProps {
  images?: TourImage[];
  className?: string;
}

export const TourGallery = ({ images = [], className }: TourGalleryProps) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  if (!images || images.length === 0) {
    return (
      <div
        className={cn(
          'w-full h-[300px] md:h-[400px] bg-muted rounded-xl flex items-center justify-center border',
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

  // Determine grid class based on image count
  const getImageGridClass = (index: number, total: number) => {
    // 5+ Images Layout
    if (total >= 5) {
      if (index === 0) return 'col-span-2 row-span-2 cursor-pointer'; // Main large
      return 'col-span-1 row-span-1 cursor-pointer'; // Small squares
    }

    // 4 Images Layout
    if (total === 4) {
      if (index === 0) return 'col-span-2 row-span-2 cursor-pointer'; // Main large left
      if (index === 1) return 'col-span-1 row-span-1 cursor-pointer'; // Top middle
      if (index === 2) return 'col-span-1 row-span-1 cursor-pointer'; // Top right
      return 'col-span-2 row-span-1 cursor-pointer'; // Bottom bar
    }

    // 3 Images Layout
    if (total === 3) {
      if (index === 0) return 'col-span-2 row-span-2 cursor-pointer'; // Main large left
      return 'col-span-2 row-span-1 cursor-pointer'; // Right stacked
    }

    // 2 Images Layout
    if (total === 2) {
      return 'col-span-2 row-span-2 cursor-pointer'; // Split vertically
    }

    // 1 Image Layout
    return 'col-span-4 row-span-2 cursor-pointer';
  };

  const displayImages = images.slice(0, 5);

  return (
    <div className={cn('relative w-full group', className)}>

      {/* Mobile: Carousel / Scroll Snap (< 500px) */}
      <div className="flex min-[500px]:hidden overflow-x-auto snap-x snap-mandatory gap-2 pb-4 -mx-4 px-4 scrollbar-hide">
        {images.map((img, index) => (
          <div
            key={img.id || index}
            className="snap-center shrink-0 w-[85vw] h-[300px] rounded-xl overflow-hidden relative"
            onClick={() => openLightbox(index)}
          >
            <img
              src={getMediaUrl(img.url)}
              alt={img.altText || `Tour image ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/5 active:bg-black/10 transition-colors" />
          </div>
        ))}
      </div>

      {/* Desktop/Tablet: BENTO GRID (>= 500px) */}
      <div className="hidden min-[500px]:grid grid-cols-4 grid-rows-2 gap-2 h-[350px] md:h-[500px] rounded-xl overflow-hidden">
        {displayImages.map((img, index) => (
          <div
            key={img.id || index}
            className={cn(
              "relative overflow-hidden group/image",
              getImageGridClass(index, images.length)
            )}
            onClick={() => openLightbox(index)}
          >
            <img
              src={getMediaUrl(img.url)}
              alt={img.altText || `Tour image ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover/image:scale-105"
            />

            {/* Overlay for "View All" on the last image if there are more */}
            {index === 4 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium text-lg backdrop-blur-[2px] transition-colors hover:bg-black/60">
                +{images.length - 5} more
              </div>
            )}

            {/* Hover overlay for interaction hint */}
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300" />

            {/* Index 0 Cover Badge */}
            {index === 0 && (
              <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-md font-medium shadow-sm z-10">
                Cover
              </span>
            )}
          </div>
        ))}
      </div>

      {/* View All Button (Desktop Floating) */}
      {images.length > 0 && (
        <div className="hidden md:block absolute bottom-4 right-4 pointer-events-none">
          <Button
            variant="secondary"
            size="sm"
            className="shadow-md gap-2 pointer-events-auto"
            onClick={() => openLightbox(0)}
          >
            <Grid className="w-4 h-4" />
            Show all photos
          </Button>
        </div>
      )}

      {/* Lightbox Component */}
      <TourLightbox
        images={images}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
};

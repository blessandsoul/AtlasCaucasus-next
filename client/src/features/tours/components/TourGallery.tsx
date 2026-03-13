'use client';

import { useState } from 'react';
import type { TourImage } from '@/features/tours/types/tour.types';
import { cn } from '@/lib/utils';
import { ImageOff, Camera } from 'lucide-react';
import { getMediaUrl } from '@/lib/utils/media';
import { TourLightbox } from './TourLightbox';

interface TourGalleryProps {
  images?: TourImage[];
  className?: string;
}

export const TourGallery = ({ images = [], className }: TourGalleryProps): React.ReactElement => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number): void => {
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

  const displayImages = images.slice(0, 3);

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

      {/* Desktop/Tablet: TripAdvisor 1+2 Grid (>= 500px) */}
      <div className="hidden min-[500px]:block">
        {/* Single image layout */}
        {displayImages.length === 1 && (
          <div
            className="relative h-[350px] md:h-[450px] rounded-xl overflow-hidden cursor-pointer group/image"
            onClick={() => openLightbox(0)}
          >
            <img
              src={getMediaUrl(displayImages[0].url)}
              alt={displayImages[0].altText || 'Tour image 1'}
              className="h-full w-full object-cover transition-transform duration-700 group-hover/image:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300" />
            {/* Photo count badge */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white text-sm font-medium rounded-full backdrop-blur-sm hover:bg-black/75 transition-colors"
              >
                <Camera className="h-4 w-4" />
                <span>{images.length}</span>
              </button>
            )}
          </div>
        )}

        {/* Multi-image grid: 1 large + 2 stacked */}
        {displayImages.length >= 2 && (
          <div className="grid grid-cols-[3fr_1fr] gap-1 h-[350px] md:h-[450px] rounded-xl overflow-hidden">
            {/* Large main image (left) */}
            <div
              className="relative overflow-hidden cursor-pointer group/image"
              onClick={() => openLightbox(0)}
            >
              <img
                src={getMediaUrl(displayImages[0].url)}
                alt={displayImages[0].altText || 'Tour image 1'}
                className="h-full w-full object-cover transition-transform duration-700 group-hover/image:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300" />

              {/* Photo count badge */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white text-sm font-medium rounded-full backdrop-blur-sm hover:bg-black/75 transition-colors"
              >
                <Camera className="h-4 w-4" />
                <span>{images.length}</span>
              </button>
            </div>

            {/* Right side: 2 stacked images */}
            <div className="grid grid-rows-2 gap-1">
              {displayImages.slice(1, 3).map((img, i) => {
                const actualIndex = i + 1;
                return (
                  <div
                    key={img.id || actualIndex}
                    className="relative overflow-hidden cursor-pointer group/image"
                    onClick={() => openLightbox(actualIndex)}
                  >
                    <img
                      src={getMediaUrl(img.url)}
                      alt={img.altText || `Tour image ${actualIndex + 1}`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover/image:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300" />
                  </div>
                );
              })}
              {/* Fill empty slot if only 2 images */}
              {displayImages.length < 3 && (
                <div className="bg-muted" />
              )}
            </div>
          </div>
        )}
      </div>

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

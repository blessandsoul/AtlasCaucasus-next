'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media';

interface Image {
  id: string;
  url: string;
  alt?: string;
}

interface ImageGalleryProps {
  images: Image[];
  columns?: number;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
}

export const ImageGallery = ({
  images,
  columns = 3,
  className,
  aspectRatio = 'square',
}: ImageGalleryProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const nextImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (lightboxIndex === null) return;
      setLightboxIndex((prev) =>
        prev !== null && prev < images.length - 1 ? prev + 1 : 0
      );
    },
    [lightboxIndex, images.length]
  );

  const prevImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (lightboxIndex === null) return;
      setLightboxIndex((prev) =>
        prev !== null && prev > 0 ? prev - 1 : images.length - 1
      );
    },
    [lightboxIndex, images.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, nextImage, prevImage]);

  if (!images || images.length === 0) return null;

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  }[aspectRatio];

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'grid gap-4',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
          columns === 4 && 'grid-cols-2 md:grid-cols-4'
        )}
      >
        {images.map((image, index) => (
          <div
            key={image.id || index}
            className={cn(
              'relative group overflow-hidden rounded-xl cursor-pointer bg-muted transition-transform duration-200 hover:scale-[1.02]',
              aspectRatioClass
            )}
            onClick={() => openLightbox(index)}
          >
            <img
              src={getMediaUrl(image.url)}
              alt={image.alt || `Gallery image ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Maximize2 className="text-white w-8 h-8 drop-shadow-md" />
            </div>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={closeLightbox}
          />

          <div className="relative w-full max-h-screen p-4 flex flex-col items-center justify-center z-10">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 z-50 rounded-full"
              onClick={closeLightbox}
            >
              <X className="w-6 h-6" />
              <span className="sr-only">Close</span>
            </Button>

            <div className="relative max-w-7xl w-full flex items-center justify-center">
              <img
                key={lightboxIndex}
                src={getMediaUrl(images[lightboxIndex].url)}
                alt={images[lightboxIndex].alt}
                className="max-h-[85vh] max-w-full object-contain rounded-sm shadow-2xl"
              />

              <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'pointer-events-auto text-white/70 hover:text-white hover:bg-black/20 rounded-full w-12 h-12 ml-4 transition-opacity',
                    images.length <= 1 && 'opacity-0'
                  )}
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'pointer-events-auto text-white/70 hover:text-white hover:bg-black/20 rounded-full w-12 h-12 mr-4 transition-opacity',
                    images.length <= 1 && 'opacity-0'
                  )}
                  onClick={nextImage}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm font-medium">
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

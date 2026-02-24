'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [lightboxIndex]);

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

      {createPortal(
        <AnimatePresence>
          {lightboxIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              onClick={closeLightbox}
            >
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                onClick={closeLightbox}
              >
                <X className="w-6 h-6" />
                <span className="sr-only">Close</span>
              </Button>

              {/* Main image + nav */}
              <div className="relative w-full h-full flex items-center justify-center px-4 py-14 pointer-events-none">
                <motion.img
                  key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  src={getMediaUrl(images[lightboxIndex].url)}
                  alt={images[lightboxIndex].alt}
                  className="max-h-full max-w-full object-contain rounded-sm shadow-2xl pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Prev / Next */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-full w-12 h-12 pointer-events-auto"
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-full w-12 h-12 pointer-events-auto"
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    >
                      <ChevronRight className="w-8 h-8" />
                    </Button>
                  </>
                )}
              </div>

              {/* Counter */}
              <div className="absolute top-4 left-4 z-10 text-white/80 font-medium bg-black/50 px-3 py-1 rounded-full text-sm backdrop-blur-sm pointer-events-none">
                {lightboxIndex + 1} / {images.length}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

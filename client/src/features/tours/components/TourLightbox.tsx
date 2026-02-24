'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TourImage } from '@/features/tours/types/tour.types';
import { getMediaUrl } from '@/lib/utils/media';

interface TourLightboxProps {
    images: TourImage[];
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export const TourLightbox = ({
    images,
    initialIndex = 0,
    isOpen,
    onClose,
}: TourLightboxProps) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Update index if initialIndex changes when opening
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        },
        [isOpen, onClose, handleNext, handlePrev]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Lock body scroll when lightbox is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm"
                    onClick={onClose}
                >
                    {/* Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 z-10 text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                        <span className="sr-only">Close</span>
                    </Button>

                    {/* Prev Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:flex absolute left-4 top-1/2 z-10 -translate-y-1/2 text-white/70 hover:bg-white/10 hover:text-white h-12 w-12 rounded-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrev();
                        }}
                    >
                        <ChevronLeft className="h-8 w-8" />
                        <span className="sr-only">Previous</span>
                    </Button>

                    {/* Next Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:flex absolute right-4 top-1/2 z-10 -translate-y-1/2 text-white/70 hover:bg-white/10 hover:text-white h-12 w-12 rounded-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNext();
                        }}
                    >
                        <ChevronRight className="h-8 w-8" />
                        <span className="sr-only">Next</span>
                    </Button>

                    {/* Main Image Container */}
                    <div className="relative h-full w-full flex flex-col items-center justify-center px-4 pt-14 pb-28 pointer-events-none">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="relative max-h-full max-w-full overflow-hidden rounded-lg shadow-2xl pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.05}
                            onDragEnd={(_e, { offset, velocity }) => {
                                const swipe = Math.abs(offset.x) * velocity.x;
                                if (swipe < -100) handleNext();
                                if (swipe > 100) handlePrev();
                            }}
                        >
                            <img
                                src={getMediaUrl(images[currentIndex].url)}
                                alt={images[currentIndex].altText || `Image ${currentIndex + 1}`}
                                className="max-h-[calc(100vh-11rem)] w-auto max-w-[95vw] object-contain select-none"
                            />
                        </motion.div>
                    </div>

                    {/* Thumbnails Strip */}
                    <div
                        className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-1.5 px-4 py-3 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {images.map((img, index) => (
                            <button
                                key={img.id || index}
                                onClick={() => setCurrentIndex(index)}
                                className={cn(
                                    "relative h-12 w-12 md:h-14 md:w-14 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                                    index === currentIndex
                                        ? "border-primary opacity-100 scale-110 z-10"
                                        : "border-transparent opacity-50 hover:opacity-80"
                                )}
                            >
                                <img
                                    src={getMediaUrl(img.url)}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="h-full w-full object-cover"
                                />
                            </button>
                        ))}
                    </div>

                    {/* Counter */}
                    <div className="absolute top-4 left-4 z-10 text-white/80 font-medium bg-black/50 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

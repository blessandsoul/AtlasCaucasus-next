'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Heart,
    Layers,
    Star,
    MapPin,
    Route,
    Quote,
    Calendar,
    Clock,
    Check,
    Zap,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tour } from '@/features/tours/types/tour.types';
import { formatCurrency } from '@/lib/utils/format';
import { getMediaUrl } from '@/lib/utils/media';

interface TourCardProps {
    tour: Tour;
    className?: string;
    onFavorite?: (id: string) => void;
}

export const TourCard = ({ tour, className, onFavorite }: TourCardProps) => {
    const router = useRouter();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const images = tour.images && tour.images.length > 0
        ? tour.images.map(img => getMediaUrl(img.url))
        : [getMediaUrl(null)];

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleCardClick = () => {
        router.push(`/explore/tours/${tour.id}`);
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onFavorite) {
            onFavorite(tour.id);
        }
    };

    // Mock rating (will be replaced with actual rating when available)
    const rating = 4.5;

    // Calculate discount if originalPrice exists
    const originalPrice = tour.originalPrice ? parseFloat(tour.originalPrice) : null;
    const currentPrice = parseFloat(tour.price);
    const discountPercent = originalPrice && originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : null;

    // Format next available date
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Check dates';
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div
            className={cn(
                "group relative flex flex-col w-full bg-white dark:bg-[#1c1c1c] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-[#2a2a2a] cursor-pointer",
                className
            )}
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Carousel Section */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-[#111]">
                <img
                    src={images[currentImageIndex]}
                    alt={tour.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 opacity-60 pointer-events-none" />

                {/* Top Right Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    <button className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Layers className="h-4 w-4 text-white" />
                    </button>
                    <button
                        onClick={handleFavoriteClick}
                        className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors group/heart"
                    >
                        <Heart className="h-4 w-4 text-white group-hover/heart:text-red-500 transition-colors" />
                    </button>
                </div>

                {/* Navigation Arrows (Visible on Hover) */}
                {images.length > 1 && isHovered && (
                    <>
                        <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </>
                )}

                {/* Bottom Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300 shadow-sm",
                                    idx === currentImageIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                                )}
                            />
                        ))}
                    </div>
                )}

                {/* Bottom Left Badge - Mock "2 booked" for now */}
                <div className="absolute bottom-4 left-4 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-10">
                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    2 booked in last hour
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-1 gap-3">

                {/* Header: Title and Rating */}
                <div className="flex justify-between items-start gap-3">
                    <h3 className="text-lg font-bold leading-tight pb-1 text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {tour.title}
                    </h3>
                    <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 shrink-0">
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        <span className="text-yellow-600 dark:text-yellow-500 font-bold text-sm">{rating}</span>
                    </div>
                </div>

                {/* Location & Route */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{tour.category || 'Tour'} • {tour.city || 'Georgia'}</span>
                    </div>
                    {tour.startLocation && (
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs">
                            <Route className="h-3 w-3 shrink-0" />
                            <span className="truncate">from {tour.startLocation}</span>
                        </div>
                    )}
                </div>

                {/* Quote */}
                {tour.summary && (
                    <div className="flex gap-2 text-gray-600 dark:text-gray-300 italic text-sm border-l-2 border-primary/50 pl-3 py-0.5 my-1">
                        <Quote className="h-3 w-3 text-primary shrink-0 rotate-180" />
                        <span className="line-clamp-1">{tour.summary}</span>
                    </div>
                )}

                {/* Info Row (Icons) */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-white/10 pt-3">

                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(tour.startDate ?? tour.nextAvailableDate)}</span>
                    </div>
                    {/* Start Time */}
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                            {tour.startDate
                                ? new Date(tour.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Flexible'}
                        </span>
                    </div>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap gap-2">
                    {tour.hasFreeCancellation && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20">
                            <Check className="h-2.5 w-2.5 mr-1" />
                            Free Cancel
                        </span>
                    )}
                    {tour.isInstantBooking && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-500/20">
                            <Zap className="h-2.5 w-2.5 mr-1" />
                            Instant
                        </span>
                    )}
                </div>

                {/* Footer: Price and Action */}
                <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100 dark:border-white/10">
                    <div className="flex flex-col">
                        {originalPrice && discountPercent && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="line-through">{formatCurrency(originalPrice, tour.currency)}</span>
                                <span className="bg-red-500/10 text-red-600 dark:text-red-500 px-1.5 py-0.5 rounded text-[10px] font-bold">-{discountPercent}%</span>
                            </div>
                        )}
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-gray-400">
                                {formatCurrency(currentPrice, tour.currency)}
                            </span>
                            <span className="text-gray-500 text-xs">per person</span>
                        </div>
                    </div>

                    <Button size="icon" className="h-9 w-9 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white dark:text-black shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>

            </div>
        </div>
    );
};

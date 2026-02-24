'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRatingLabel } from '@/lib/utils/rating';
import type { Tour } from '@/features/tours/types/tour.types';
import { getMediaUrl } from '@/lib/utils/media';
import { useCurrency } from '@/context/CurrencyContext';

interface TourCardProps {
    tour: Tour;
    className?: string;
    isFavorited?: boolean;
    onFavorite?: (id: string) => void;
}

export const TourCard = ({ tour, className, isFavorited, onFavorite }: TourCardProps): JSX.Element => {
    const { t } = useTranslation();
    const router = useRouter();
    const { formatPrice } = useCurrency();

    const imageUrl = tour.images && tour.images.length > 0
        ? getMediaUrl(tour.images[0].url)
        : getMediaUrl(null);

    const rating = tour.averageRating ? parseFloat(tour.averageRating) : null;
    const currentPrice = parseFloat(tour.price);
    const originalPrice = tour.originalPrice ? parseFloat(tour.originalPrice) : null;
    const hasDiscount = originalPrice && originalPrice > currentPrice;

    const handleCardClick = (): void => {
        router.push(`/explore/tours/${tour.id}`);
    };

    const handleFavoriteClick = (e: React.MouseEvent): void => {
        e.stopPropagation();
        onFavorite?.(tour.id);
    };

    return (
        <div
            className={cn(
                'group relative flex flex-col bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
                className
            )}
            onClick={handleCardClick}
        >
            {/* Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                    src={imageUrl}
                    alt={tour.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                <button
                    onClick={handleFavoriteClick}
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10"
                    aria-label={isFavorited ? t('common.remove_favorite') : t('common.add_favorite')}
                >
                    <Heart className={cn(
                        'h-4.5 w-4.5 transition-colors',
                        isFavorited
                            ? 'fill-red-500 text-red-500'
                            : 'text-foreground/70 hover:text-red-500'
                    )} />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-2">
                <h3 className="text-base font-semibold leading-tight text-foreground line-clamp-1">
                    {tour.title}
                </h3>

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{tour.city || 'Georgia'}</span>
                </div>

                {/* Rating Badge */}
                <div className="flex items-center gap-1.5 mt-1">
                    {rating ? (
                        <>
                            <span className="bg-primary text-primary-foreground rounded-md px-1.5 py-0.5 text-sm font-bold leading-none">
                                {rating.toFixed(1)}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {getRatingLabel(rating)}
                            </span>
                            {tour.reviewCount > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    &middot; {tour.reviewCount} {tour.reviewCount === 1 ? t('common.review') : t('common.reviews')}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-sm text-muted-foreground">{t('tour_card.new')}</span>
                    )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xs text-muted-foreground">{t('tour_card.starting_from', 'Starting from')}</span>
                    {hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(originalPrice, tour.currency)}
                        </span>
                    )}
                    <span className="text-lg font-bold text-foreground">
                        {formatPrice(currentPrice, tour.currency)}
                    </span>
                </div>
            </div>
        </div>
    );
};

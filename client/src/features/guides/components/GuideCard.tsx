'use client';

import { useRouter } from 'next/navigation';
import { Heart, MapPin, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRatingLabel } from '@/lib/utils/rating';
import type { Guide, GuideLocation, Location } from '../types/guide.types';
import { getMediaUrl } from '@/lib/utils/media';
import { useCurrency } from '@/context/CurrencyContext';

interface GuideCardProps {
    guide: Guide;
    className?: string;
    isFavorited?: boolean;
    onFavorite?: (id: string) => void;
    isCompareSelected?: boolean;
    onCompareToggle?: (id: string, meta: { label: string; imageUrl: string | null }) => void;
}

export const GuideCard = ({ guide, className, isFavorited, onFavorite, isCompareSelected, onCompareToggle }: GuideCardProps): JSX.Element | null => {
    const router = useRouter();
    const { formatPrice } = useCurrency();

    if (!guide) return null;

    const getPhotoUrl = (): string => {
        if (guide.avatarUrl) return getMediaUrl(guide.avatarUrl);
        if (guide.photos && guide.photos.length > 0) return getMediaUrl(guide.photos[0].url);
        if (guide.photoUrl) return getMediaUrl(guide.photoUrl);
        return getMediaUrl(null);
    };
    const photoUrl = getPhotoUrl();
    const fullName = guide.user
        ? `${guide.user.firstName} ${guide.user.lastName}`
        : 'Unknown Guide';
    const rating = guide.averageRating ? parseFloat(guide.averageRating) : null;

    const getPrimaryLocation = (): Location | null => {
        if (!guide.locations || guide.locations.length === 0) return null;
        const firstLocation = guide.locations[0];
        if ('location' in firstLocation && firstLocation.location) {
            const primary = (guide.locations as GuideLocation[]).find(loc => loc.isPrimary);
            return primary?.location || (guide.locations[0] as GuideLocation).location || null;
        }
        return (guide.locations as unknown as Location[])[0] || null;
    };
    const primaryLocation = getPrimaryLocation();

    const handleCardClick = (): void => {
        router.push(`/explore/guides/${guide.id}`);
    };

    const handleFavoriteClick = (e: React.MouseEvent): void => {
        e.stopPropagation();
        onFavorite?.(guide.id);
    };

    const handleCompareClick = (e: React.MouseEvent): void => {
        e.stopPropagation();
        onCompareToggle?.(guide.id, { label: fullName, imageUrl: photoUrl });
    };

    return (
        <div
            className={cn(
                'group relative flex flex-col bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
                isCompareSelected && 'ring-2 ring-primary border-primary/50',
                className
            )}
            onClick={handleCardClick}
        >
            {/* Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                    src={photoUrl}
                    alt={fullName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    <button
                        onClick={handleCompareClick}
                        className={cn(
                            'h-9 w-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors',
                            isCompareSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-white/80 hover:bg-white text-foreground/70'
                        )}
                        aria-label={isCompareSelected ? 'Remove from comparison' : 'Add to comparison'}
                    >
                        <Layers className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleFavoriteClick}
                        className="h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Heart className={cn(
                            'h-4.5 w-4.5 transition-colors',
                            isFavorited
                                ? 'fill-red-500 text-red-500'
                                : 'text-foreground/70 hover:text-red-500'
                        )} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-2">
                <h3 className="text-base font-semibold leading-tight text-foreground line-clamp-1">
                    {fullName}
                </h3>

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{primaryLocation?.name || 'Georgia'}</span>
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
                            {guide.reviewCount > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    &middot; {guide.reviewCount} {guide.reviewCount === 1 ? 'review' : 'reviews'}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-sm text-muted-foreground">New</span>
                    )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mt-1">
                    {guide.pricePerDay ? (
                        <>
                            <span className="text-lg font-bold text-foreground">
                                {formatPrice(Number(guide.pricePerDay), guide.currency || 'GEL')}
                            </span>
                            <span className="text-sm text-muted-foreground">/ day</span>
                        </>
                    ) : (
                        <span className="text-sm text-muted-foreground">Contact for price</span>
                    )}
                </div>
            </div>
        </div>
    );
};

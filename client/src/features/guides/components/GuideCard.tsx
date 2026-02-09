'use client';

import { useRouter } from 'next/navigation';
import {
  Heart,
  Star,
  MapPin,
  ArrowRight,
  Languages,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Guide, GuideLocation, Location } from '../types/guide.types';
import { getMediaUrl } from '@/lib/utils/media';
import { formatResponseTime } from '@/lib/utils/format';
import { useCurrency } from '@/context/CurrencyContext';

interface GuideCardProps {
  guide: Guide;
  className?: string;
  isFavorited?: boolean;
  onFavorite?: (id: string) => void;
  isCompareSelected?: boolean;
  onCompareToggle?: (id: string, meta: { label: string; imageUrl: string | null }) => void;
}

export const GuideCard = ({ guide, className, isFavorited, onFavorite, isCompareSelected, onCompareToggle }: GuideCardProps) => {
  const router = useRouter();
  const { formatPrice } = useCurrency();

  if (!guide) return null;

  // Use avatarUrl first, then first photo from photos array, fallback to photoUrl, then placeholder
  const getPhotoUrl = () => {
    if (guide.avatarUrl) {
      return getMediaUrl(guide.avatarUrl);
    }
    if (guide.photos && guide.photos.length > 0) {
      return getMediaUrl(guide.photos[0].url);
    }
    if (guide.photoUrl) {
      return getMediaUrl(guide.photoUrl);
    }
    return getMediaUrl(null);
  };
  const photoUrl = getPhotoUrl();
  const fullName = guide.user
    ? `${guide.user.firstName} ${guide.user.lastName}`
    : 'Unknown Guide';

  const rating = guide.averageRating ? parseFloat(guide.averageRating) : null;

  // Safely get primary location
  const getPrimaryLocation = (): Location | null => {
    if (!guide.locations || guide.locations.length === 0) return null;

    // Handle GuideLocation[] (nested)
    const firstLocation = guide.locations[0];
    if ('location' in firstLocation && firstLocation.location) {
      const primary = (guide.locations as GuideLocation[]).find(loc => loc.isPrimary);
      return primary?.location || (guide.locations[0] as GuideLocation).location || null;
    }

    // Handle Location[] (flat)
    return (guide.locations as unknown as Location[])[0] || null;
  };

  const primaryLocation = getPrimaryLocation();
  const otherLocationsCount = (guide.locations?.length || 0) - (primaryLocation ? 1 : 0);

  // Safe language parsing helper
  const getLanguages = (): string[] => {
    if (!guide.languages) return [];
    if (Array.isArray(guide.languages)) return guide.languages;
    if (typeof guide.languages === 'string') {
      try {
        const parsed = JSON.parse(guide.languages);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const languagesArray = getLanguages();

  const handleCardClick = () => {
    router.push(`/explore/guides/${guide.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(guide.id);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col w-full bg-white dark:bg-[#1c1c1c] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-[#2a2a2a] cursor-pointer",
        isCompareSelected && "ring-2 ring-primary border-primary/50",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-[#111]">
        <img
          src={photoUrl}
          alt={fullName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

        {/* Top Right Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onCompareToggle?.(guide.id, { label: fullName, imageUrl: photoUrl });
            }}
            className={cn(
              "h-8 w-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors",
              isCompareSelected
                ? "bg-primary text-primary-foreground"
                : "bg-white/20 hover:bg-white/30"
            )}
            aria-label={isCompareSelected ? "Remove from comparison" : "Add to comparison"}
          >
            <Layers className={cn("h-4 w-4", !isCompareSelected && "text-white")} />
          </button>
          <button
            onClick={handleFavoriteClick}
            className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors group/heart"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn(
              "h-4 w-4 transition-colors",
              isFavorited
                ? "fill-red-500 text-red-500"
                : "text-white group-hover/heart:text-red-500"
            )} />
          </button>
        </div>

      </div>

      {/* Content Section */}
      <div className="p-4 max-[600px]:p-3 flex flex-col flex-1 gap-3 max-[600px]:gap-2">

        {/* Header: Name and Rating */}
        <div className="flex justify-between items-start gap-3">
          <h3 className="text-lg max-[600px]:text-base font-bold leading-tight text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
            {fullName}
          </h3>
          <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 shrink-0 max-[600px]:hidden">
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
            <span className="text-yellow-600 dark:text-yellow-500 font-bold text-sm">{rating ? rating.toFixed(1) : 'New'}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            {/* Mobile Only Rating */}
            <div className="hidden max-[600px]:flex items-center gap-1 text-yellow-600 dark:text-yellow-500 font-bold text-xs pr-2 border-r border-gray-300 dark:border-gray-700">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span>{rating ? rating.toFixed(1) : 'New'}</span>
            </div>

            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {primaryLocation?.name || 'Georgia'}
              {otherLocationsCount > 0 && ` +${otherLocationsCount} more`}
            </span>
          </div>
          {guide.yearsOfExperience && (
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs max-[600px]:hidden">
              <span className="font-medium">{guide.yearsOfExperience} years experience</span>
            </div>
          )}
        </div>

        {/* Languages (replacing quote/summary) */}
        {languagesArray.length > 0 && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm border-l-2 border-primary/50 pl-3 py-0.5 my-1 max-[600px]:hidden">
            <Languages className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="line-clamp-1">{languagesArray.slice(0, 3).join(', ')}</span>
          </div>
        )}

        {/* Badges Row */}
        <div className="flex items-center flex-wrap gap-2 text-xs border-t border-gray-100 dark:border-white/10 pt-3 max-[600px]:hidden">
          {guide.isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          )}
          {(() => {
            const rt = formatResponseTime(guide.avgResponseTimeMinutes);
            if (!rt) return null;
            const variantClasses = {
              success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              muted: 'bg-gray-500/10 text-gray-500 dark:text-gray-400',
            };
            return (
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium', variantClasses[rt.variant])}>
                <Clock className="h-3 w-3" />
                Responds {rt.label}
              </span>
            );
          })()}
        </div>

        {/* Footer: Price and Action */}
        <div className="mt-auto pt-3 max-[600px]:pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/10">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              {guide.pricePerDay ? (
                <>
                  <span className="text-xl max-[600px]:text-lg font-bold text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-gray-400">
                    {formatPrice(Number(guide.pricePerDay), guide.currency || 'GEL')}
                  </span>
                  <span className="text-gray-500 text-xs">/ day</span>
                </>
              ) : (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Contact for price
                </span>
              )}
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

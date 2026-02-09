'use client';

import { useRouter } from 'next/navigation';
import {
  Heart,
  ArrowRight,
  Globe,
  Phone,
  Building2,
  Star,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Company } from '../types/company.types';
import { getMediaUrl } from '@/lib/utils/media';
import { formatResponseTime } from '@/lib/utils/format';

interface CompanyCardProps {
  company: Company;
  className?: string;
  isFavorited?: boolean;
  onFavorite?: (id: string) => void;
  isCompareSelected?: boolean;
  onCompareToggle?: (id: string, meta: { label: string; imageUrl: string | null }) => void;
}

export const CompanyCard = ({ company, className, isFavorited, onFavorite, isCompareSelected, onCompareToggle }: CompanyCardProps) => {
  const router = useRouter();

  if (!company) return null;

  // Use first image from images array, fallback to logoUrl, then placeholder
  const getImageUrl = () => {
    if (company.images && company.images.length > 0) {
      return getMediaUrl(company.images[0].url);
    }
    if (company.logoUrl) {
      return getMediaUrl(company.logoUrl);
    }
    return null;
  };
  const imageUrl = getImageUrl();
  const rating = company.averageRating ? Number(company.averageRating) : null;

  const handleCardClick = () => {
    router.push(`/explore/companies/${company.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(company.id);
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
      {/* Image/Logo Section */}
      <div className={cn(
        "relative aspect-[4/3] w-full overflow-hidden bg-gray-50 dark:bg-[#111]",
        !imageUrl && "flex items-center justify-center p-8"
      )}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={company.companyName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Building2 className="w-20 h-20 text-gray-300 dark:text-gray-700" />
        )}

        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 pointer-events-none" />

        {/* Top Right Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onCompareToggle?.(company.id, { label: company.companyName, imageUrl: imageUrl });
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
                : "text-gray-600 dark:text-white group-hover/heart:text-red-500"
            )} />
          </button>
        </div>

      </div>

      {/* Content Section */}
      <div className="p-4 max-[600px]:p-3 flex flex-col flex-1 gap-3 max-[600px]:gap-2">

        {/* Header: Name and Rating */}
        <div className="flex justify-between items-start gap-3">
          <h3 className="text-lg max-[600px]:text-base font-bold leading-tight text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
            {company.companyName}
          </h3>
          <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 shrink-0 max-[600px]:hidden">
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
            <span className="text-yellow-600 dark:text-yellow-500 font-bold text-sm">{rating ? rating.toFixed(1) : 'New'}</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1.5">
          {/* Mobile Only Rating */}
          <div className="hidden max-[600px]:flex items-center gap-1 text-yellow-600 dark:text-yellow-500 font-bold text-xs">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span>{rating ? rating.toFixed(1) : 'New'}</span>
          </div>

          {company.websiteUrl && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span
                className="truncate text-xs hover:underline hover:text-primary"
                onClick={(e) => { e.stopPropagation(); window.open(company.websiteUrl!, '_blank'); }}
              >
                {company.websiteUrl.replace(/^https?:\/\//, '')}
              </span>
            </div>
          )}

          {company.phoneNumber && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{company.phoneNumber}</span>
            </div>
          )}
        </div>

        {/* Badges Row */}
        <div className="flex items-center flex-wrap gap-2 text-xs max-[600px]:hidden">
          {company.isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          )}
          {(() => {
            const rt = formatResponseTime(company.avgResponseTimeMinutes);
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

        {/* Description Excerpt */}
        {company.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mt-1 max-[600px]:hidden">
            {company.description}
          </p>
        )}

        {/* Footer: Action */}
        <div className="mt-auto pt-3 max-[600px]:pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/10">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground max-[600px]:hidden">
              Since {new Date(company.createdAt).getFullYear()}
            </span>
          </div>

          <Button size="icon" className="h-9 w-9 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white dark:text-black shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

      </div>
    </div>
  );
};

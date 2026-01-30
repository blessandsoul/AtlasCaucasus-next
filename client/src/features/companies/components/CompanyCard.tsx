'use client';

import { useRouter } from 'next/navigation';
import {
  Heart,
  ArrowRight,
  Check,
  Globe,
  Phone,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Company } from '../types/company.types';
import { getMediaUrl } from '@/lib/utils/media';

interface CompanyCardProps {
  company: Company;
  className?: string;
  onFavorite?: (id: string) => void;
}

export const CompanyCard = ({ company, className, onFavorite }: CompanyCardProps) => {
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
            onClick={handleFavoriteClick}
            className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors group/heart"
          >
            <Heart className="h-4 w-4 text-gray-600 dark:text-white group-hover/heart:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Verified Badge */}
        {company.isVerified && (
          <div className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-10">
            <Check className="h-3 w-3" />
            Verified
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 gap-3">

        {/* Header: Name */}
        <div className="flex justify-between items-start gap-3">
          <h3 className="text-lg font-bold leading-tight text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
            {company.companyName}
          </h3>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1.5">
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

        {/* Description Excerpt */}
        {company.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mt-1">
            {company.description}
          </p>
        )}

        {/* Footer: Action */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100 dark:border-white/10">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              Since {new Date(company.createdAt).getFullYear()}
            </span>
          </div>

          <Button className="h-8 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white dark:text-black font-semibold px-4 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all text-xs">
            View Profile
            <ArrowRight className="h-3 w-3 ml-2" />
          </Button>
        </div>

      </div>
    </div>
  );
};

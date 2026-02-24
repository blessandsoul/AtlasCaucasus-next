'use client';

import { useRouter } from 'next/navigation';
import { Heart, MapPin, Building2, Layers, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRatingLabel } from '@/lib/utils/rating';
import type { Company } from '../types/company.types';
import { getMediaUrl } from '@/lib/utils/media';

interface CompanyCardProps {
    company: Company;
    className?: string;
    isFavorited?: boolean;
    onFavorite?: (id: string) => void;
    isCompareSelected?: boolean;
    onCompareToggle?: (id: string, meta: { label: string; imageUrl: string | null }) => void;
}

export const CompanyCard = ({ company, className, isFavorited, onFavorite, isCompareSelected, onCompareToggle }: CompanyCardProps): JSX.Element | null => {
    const router = useRouter();

    if (!company) return null;

    const getImageUrl = (): string | null => {
        if (company.images && company.images.length > 0) return getMediaUrl(company.images[0].url);
        if (company.logoUrl) return getMediaUrl(company.logoUrl);
        return null;
    };
    const imageUrl = getImageUrl();
    const rating = company.averageRating ? Number(company.averageRating) : null;

    const handleCardClick = (): void => {
        router.push(`/explore/companies/${company.id}`);
    };

    const handleFavoriteClick = (e: React.MouseEvent): void => {
        e.stopPropagation();
        onFavorite?.(company.id);
    };

    const handleCompareClick = (e: React.MouseEvent): void => {
        e.stopPropagation();
        onCompareToggle?.(company.id, { label: company.companyName, imageUrl });
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
            <div className={cn(
                'relative aspect-[4/3] w-full overflow-hidden',
                !imageUrl && 'flex items-center justify-center bg-muted'
            )}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={company.companyName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <Building2 className="w-16 h-16 text-muted-foreground/30" />
                )}
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
                    {company.companyName}
                </h3>

                {company.websiteUrl && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{company.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                    </div>
                )}

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
                            {company.reviewCount > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    &middot; {company.reviewCount} {company.reviewCount === 1 ? 'review' : 'reviews'}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-sm text-muted-foreground">New</span>
                    )}
                </div>

                {/* Verified Badge (instead of price) */}
                {company.isVerified && (
                    <div className="flex items-center gap-1.5 mt-1">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-600">Verified</span>
                    </div>
                )}
            </div>
        </div>
    );
};

'use client';

import { useRouter } from 'next/navigation';
import { Heart, Star, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ListingCardProps {
    id: string;
    title: string;
    image: string;
    location: string;
    rating: number;
    reviewCount: number;
    price: number;
    currency: string;
    category?: string;
    className?: string;
    onFavorite?: (id: string, e: React.MouseEvent) => void;
}

export const ListingCard = ({
    id,
    title,
    image,
    location,
    rating,
    reviewCount,
    price,
    currency,
    className,
    onFavorite,
}: ListingCardProps) => {
    const router = useRouter();

    const handleCardClick = () => {
        router.push(`/tours/${id}`);
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onFavorite) {
            onFavorite(id, e);
        }
    };

    return (
        <div
            className={cn(
                "group relative bg-white dark:bg-[#1c1c1c] rounded-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 dark:border-[#2a2a2a] flex flex-col h-full",
                className
            )}
            onClick={handleCardClick}
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] w-full bg-gray-100 dark:bg-[#111]">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Rating Badge */}
                <div className="absolute top-3 left-3 bg-white dark:bg-black/80 rounded px-2 py-1 flex items-center gap-1.5 shadow-sm border border-gray-100 dark:border-white/10">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-900 dark:text-white text-xs font-bold">{rating.toFixed(1)}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-[10px]">({reviewCount})</span>
                </div>

                {/* Favorite Button */}
                <button
                    onClick={handleFavoriteClick}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 dark:bg-black/60 hover:bg-white dark:hover:bg-black transition-colors group/heart shadow-sm"
                >
                    <Heart className="w-4 h-4 text-gray-700 dark:text-white/90 group-hover/heart:text-red-500 transition-colors" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                {/* Location */}
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium line-clamp-1">{location}</span>
                </div>

                {/* Title */}
                <h3 className="text-gray-900 dark:text-white font-bold text-base mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {title}
                </h3>

                {/* Divider / Spacer */}
                <div className="mt-auto border-t border-gray-100 dark:border-[#2a2a2a] pt-3 flex items-end justify-between">

                    {/* Price */}
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px] uppercase font-semibold tracking-wide mb-0.5">from</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-primary dark:text-cyan-400 font-bold text-lg">
                                {price.toLocaleString()}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                                {currency}
                            </span>
                        </div>
                    </div>

                    {/* Action Arrow */}
                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#2a2a2a] flex items-center justify-center group-hover:bg-primary group-hover:text-white dark:group-hover:bg-cyan-500/20 dark:group-hover:text-cyan-400 transition-colors">
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white dark:group-hover:text-cyan-400 transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
};

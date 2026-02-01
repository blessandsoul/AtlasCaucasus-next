'use client';

import { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const gapClasses = {
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1.5',
};

export const StarRating = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  className,
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleMouseEnter = useCallback(
    (index: number) => {
      if (interactive) {
        setHoverRating(index);
      }
    },
    [interactive]
  );

  const handleMouseLeave = useCallback(() => {
    if (interactive) {
      setHoverRating(null);
    }
  }, [interactive]);

  const handleClick = useCallback(
    (index: number) => {
      if (interactive && onChange) {
        onChange(index);
      }
    },
    [interactive, onChange]
  );

  const displayRating = hoverRating ?? rating;

  return (
    <div
      className={cn('inline-flex items-center', gapClasses[size], className)}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayRating;
        const isHalf = !isFilled && starValue - 0.5 <= displayRating;

        return (
          <button
            key={index}
            type="button"
            className={cn(
              'relative transition-colors',
              interactive
                ? 'cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-sm'
                : 'cursor-default'
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            disabled={!interactive}
            aria-label={interactive ? `Rate ${starValue} stars` : undefined}
          >
            {/* Background star (empty) */}
            <Star
              className={cn(
                sizeClasses[size],
                'text-muted-foreground/30 stroke-muted-foreground/50'
              )}
            />
            {/* Foreground star (filled) */}
            {(isFilled || isHalf) && (
              <Star
                className={cn(
                  sizeClasses[size],
                  'absolute inset-0 fill-amber-400 text-amber-400',
                  isHalf && 'clip-path-half'
                )}
                style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

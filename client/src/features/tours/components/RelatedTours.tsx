'use client';

import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TourCard } from './TourCard';
import { useRelatedTours } from '../hooks/useTours';
import { cn } from '@/lib/utils';

interface RelatedToursProps {
    tourId: string;
    className?: string;
}

export function RelatedTours({ tourId, className }: RelatedToursProps): React.ReactElement | null {
    const { t } = useTranslation();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const { data: tours, isLoading } = useRelatedTours(tourId);

    const updateScrollButtons = useCallback((): void => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }, []);

    const scroll = useCallback((direction: 'left' | 'right'): void => {
        if (!scrollRef.current) return;
        const cardWidth = scrollRef.current.clientWidth > 768 ? 340 : 280;
        const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }, []);

    // Loading skeleton
    if (isLoading) {
        return (
            <section className={cn("mt-12", className)}>
                <h2 className="text-2xl font-bold mb-6">
                    {t('related_tours.title', 'You might also like')}
                </h2>
                <div className="flex gap-5 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="min-w-[280px] md:min-w-[320px] rounded-2xl bg-muted animate-pulse"
                        >
                            <div className="aspect-[4/3] rounded-t-2xl bg-muted-foreground/10" />
                            <div className="p-4 space-y-3">
                                <div className="h-5 w-3/4 rounded bg-muted-foreground/10" />
                                <div className="h-4 w-1/2 rounded bg-muted-foreground/10" />
                                <div className="h-4 w-1/3 rounded bg-muted-foreground/10" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    // Don't render if no related tours
    if (!tours || tours.length === 0) {
        return null;
    }

    return (
        <section className={cn("mt-12", className)}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                    {t('related_tours.title', 'You might also like')}
                </h2>
                {tours.length > 2 && (
                    <div className="hidden md:flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            aria-label={t('related_tours.scroll_left', 'Scroll left')}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            aria-label={t('related_tours.scroll_right', 'Scroll right')}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div
                ref={scrollRef}
                onScroll={updateScrollButtons}
                className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1"
            >
                {tours.map((tour) => (
                    <div
                        key={tour.id}
                        className="min-w-[280px] md:min-w-[320px] max-w-[340px] snap-start shrink-0"
                    >
                        <TourCard tour={tour} />
                    </div>
                ))}
            </div>
        </section>
    );
}

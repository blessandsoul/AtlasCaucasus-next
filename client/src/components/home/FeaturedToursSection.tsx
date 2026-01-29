'use client';

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TourCard } from '@/features/tours/components/TourCard';
import { useTours } from '@/features/tours/hooks/useTours';

export const FeaturedToursSection = () => {
    const { t } = useTranslation();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Fetch featured tours (limit to 6 for carousel)
    const { data, isLoading } = useTours({ limit: 6 });
    const featuredTours = data?.items || [];

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className="py-20 bg-muted/20 overflow-hidden">
            <div className="container mx-auto px-4 mb-10 flex items-end justify-between">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-gradient leading-tight pb-2">
                        {t('home.features.title')}
                    </h2>
                    <p className="text-muted-foreground">{t('home.features.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => scroll('left')} className="rounded-full">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => scroll('right')} className="rounded-full">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-6 px-4 md:px-8 pb-8 snap-x snap-mandatory scrollbar-hide container mx-auto scroll-smooth"
            >
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="min-w-[300px] md:min-w-[350px] snap-center">
                            <Skeleton className="h-[400px] w-full rounded-2xl" />
                        </div>
                    ))
                ) : (
                    featuredTours.map((tour, i) => (
                        <motion.div
                            key={tour.id}
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="min-w-[300px] md:min-w-[350px] snap-center"
                        >
                            <TourCard tour={tour} className="h-full" />
                        </motion.div>
                    ))
                )}
            </div>
        </section>
    );
};

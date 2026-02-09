'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Users, Mountain, Map, ChevronDown } from 'lucide-react';
import type { Tour } from '@/features/tours/types/tour.types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface TourInfoProps {
  tour: Tour;
  className?: string;
}

const ITINERARY_COLLAPSE_THRESHOLD = 5;
const ITINERARY_INITIAL_SHOW = 3;

export const TourInfo = ({ tour, className }: TourInfoProps) => {
  const { t } = useTranslation();
  const [showAllSteps, setShowAllSteps] = useState(false);

  const itinerary = tour.itinerary ?? [];
  const shouldCollapse = itinerary.length > ITINERARY_COLLAPSE_THRESHOLD;
  const visibleSteps = shouldCollapse && !showAllSteps
    ? itinerary.slice(0, ITINERARY_INITIAL_SHOW)
    : itinerary;

  return (
    <div className={cn('space-y-8', className)}>
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tour.durationMinutes && (
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-card border shadow-sm">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {t('tours.detail.duration', 'Duration')}
            </span>
            <span className="font-medium text-foreground">
              {Math.floor(tour.durationMinutes / 60)}h {tour.durationMinutes % 60}m
            </span>
          </div>
        )}

        {tour.maxPeople && (
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-card border shadow-sm">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {t('tours.detail.group_size', 'Group Size')}
            </span>
            <span className="font-medium text-foreground">
              {t('tours.detail.up_to', 'Up to {{count}}', { count: tour.maxPeople })}
            </span>
          </div>
        )}

        {tour.difficulty && (
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-card border shadow-sm">
            <Mountain className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {t('tours.detail.difficulty', 'Difficulty')}
            </span>
            <span className="font-medium text-foreground capitalize">
              {tour.difficulty}
            </span>
          </div>
        )}

        {tour.startLocation && (
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-card border shadow-sm">
            <Map className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {t('tours.detail.start', 'Start')}
            </span>
            <span
              className="font-medium text-foreground truncate"
              title={tour.startLocation}
            >
              {tour.startLocation}
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Description */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">
          {t('tours.detail.about', 'About this Experience')}
        </h2>
        <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
          <p className="whitespace-pre-line">
            {tour.description || tour.summary || t('tours.detail.no_description', 'No description available.')}
          </p>
        </div>
      </div>

      {/* Itinerary */}
      {itinerary.length > 0 && (
        <>
          <Separator />
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">
              {t('tours.detail.itinerary', 'Itinerary')}
            </h2>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-primary/20" />

              <div className="space-y-6">
                {visibleSteps.map((step, index) => (
                  <div key={index} className="relative flex gap-4">
                    {/* Step number circle */}
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm">
                      {index + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-2 min-w-0">
                      <h3 className="font-semibold text-foreground leading-8">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Show all / Show less toggle */}
            {shouldCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllSteps(!showAllSteps)}
                className="text-primary hover:text-primary/80"
              >
                {showAllSteps
                  ? t('tours.detail.show_less', 'Show less')
                  : t('tours.detail.show_all_steps', 'Show all {{count}} steps', { count: itinerary.length })}
                <ChevronDown className={cn(
                  'ml-1 h-4 w-4 transition-transform duration-200',
                  showAllSteps && 'rotate-180'
                )} />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

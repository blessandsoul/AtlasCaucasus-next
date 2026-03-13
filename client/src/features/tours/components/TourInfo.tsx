'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import {
  Clock,
  Users,
  Mountain,
  Map,
  MapPin,
  ChevronDown,
  Zap,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import type { Tour, ItineraryStep } from '@/features/tours/types/tour.types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ItineraryMap = dynamic(
  () => import('./ItineraryMap').then((mod) => mod.ItineraryMap),
  { ssr: false }
);

/* ─── TourAbout (includes trust badges + quick stats) ─── */

interface TourAboutProps {
  tour: Tour;
  className?: string;
}

const DESCRIPTION_TRUNCATE_LENGTH = 500;

export const TourAbout = ({ tour, className }: TourAboutProps): React.ReactElement => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const description = tour.description || tour.summary || '';
  const isLong = description.length > DESCRIPTION_TRUNCATE_LENGTH;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section heading */}
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        {t('tours.detail.about', 'About')}
      </h2>

      {/* Description with Read more */}
      <div className="text-foreground/80 leading-relaxed">
        {description ? (
          <>
            <p className="whitespace-pre-line">
              {isLong && !isExpanded
                ? `${description.slice(0, DESCRIPTION_TRUNCATE_LENGTH)}...`
                : description}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-sm font-bold text-foreground hover:text-foreground/80 underline underline-offset-2 transition-colors"
              >
                {isExpanded
                  ? t('tours.detail.read_less', 'Read less')
                  : t('tours.detail.read_more', 'Read more')}
              </button>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">
            {t('tours.detail.no_description', 'No description available.')}
          </p>
        )}
      </div>

      {/* Trust Badges — TripAdvisor style */}
      {(tour.hasFreeCancellation || tour.isInstantBooking) && (
        <ul className="space-y-4">
          {tour.hasFreeCancellation && (
            <li className="flex items-start gap-3 text-sm">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mt-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="leading-relaxed">
                <span className="font-semibold text-foreground underline underline-offset-2">
                  {t('tours.detail.free_cancellation', 'Free cancellation')}
                </span>
                <span className="mx-1.5 text-muted-foreground">&bull;</span>
                <span className="text-muted-foreground">
                  {t('tours.detail.free_cancellation_desc', 'Full refund if cancelled up to 24 hours before the experience starts.')}
                </span>
              </p>
            </li>
          )}
          {tour.isInstantBooking && (
            <li className="flex items-start gap-3 text-sm">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mt-0.5">
                <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="leading-relaxed">
                <span className="font-semibold text-foreground underline underline-offset-2">
                  {t('tours.detail.instant_confirmation', 'Instant confirmation')}
                </span>
                <span className="mx-1.5 text-muted-foreground">&bull;</span>
                <span className="text-muted-foreground">
                  {t('tours.detail.instant_confirmation_desc', 'You will receive confirmation immediately after booking.')}
                </span>
              </p>
            </li>
          )}
        </ul>
      )}

      {/* Quick Stats — simple vertical lines */}
      <div className="space-y-3">
        {tour.maxPeople && (
          <div className="flex items-center gap-2.5 text-sm text-foreground">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>Max of {tour.maxPeople} per group</span>
          </div>
        )}
        {tour.durationMinutes && (
          <div className="flex items-center gap-2.5 text-sm text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              Duration: {Math.floor(tour.durationMinutes / 60)}h
              {tour.durationMinutes % 60 > 0 ? ` ${tour.durationMinutes % 60}m` : ''}
            </span>
          </div>
        )}
        {tour.difficulty && (
          <div className="flex items-center gap-2.5 text-sm text-foreground">
            <Mountain className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>Difficulty: {tour.difficulty.charAt(0).toUpperCase() + tour.difficulty.slice(1)}</span>
          </div>
        )}
        {tour.startLocation && (
          <div className="flex items-center gap-2.5 text-sm text-foreground">
            <Map className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>Start: {tour.startLocation}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── TourItinerary ─── */

interface TourItineraryProps {
  itinerary: ItineraryStep[] | null;
  className?: string;
}

const ITINERARY_COLLAPSE_THRESHOLD = 5;
const ITINERARY_INITIAL_SHOW = 3;

const formatStopDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? 's' : ''}`;
};

export const TourItinerary = ({
  itinerary: rawItinerary,
  className,
}: TourItineraryProps): React.ReactElement | null => {
  const { t } = useTranslation();
  const [showAllSteps, setShowAllSteps] = useState(false);

  const itinerary = rawItinerary ?? [];
  if (itinerary.length === 0) return null;

  const shouldCollapse = itinerary.length > ITINERARY_COLLAPSE_THRESHOLD;
  const visibleSteps = shouldCollapse && !showAllSteps
    ? itinerary.slice(0, ITINERARY_INITIAL_SHOW)
    : itinerary;

  // Check if any itinerary step has resolved coordinates for the map
  const hasMapLocations = itinerary.some(
    (step) => step.latitude != null && step.longitude != null
  );

  // Derive location names from steps that have a linked location
  const locationNames = itinerary
    .filter((step) => step.locationName)
    .map((step) => step.locationName!);
  const uniqueLocationNames = [...new Set(locationNames)];

  return (
    <div className={cn('space-y-8', className)}>
      {/* Section heading + summary */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {t('tours.detail.itinerary', 'Itinerary')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('tours.detail.itinerary_summary', "You'll visit {{count}} stops", { count: itinerary.length })}
          {uniqueLocationNames.length > 0 && (
            <> &middot; {uniqueLocationNames.join(', ')}</>
          )}
        </p>
      </div>

      {/* Map — show if any itinerary step has coordinates */}
      {hasMapLocations && (
        <ItineraryMap steps={itinerary} />
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border" />

        <div className="space-y-0">
          {visibleSteps.map((step, index) => {
            const isPassBy = step.stopType === 'pass_by';

            return (
              <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
                {/* Step number circle */}
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {/* Stop type badge */}
                  <div className="flex items-center gap-2 mb-1">
                    {isPassBy ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {t('tours.detail.pass_by', 'Pass by')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {step.duration
                          ? t('tours.detail.stop_duration', 'Stop: {{duration}}', { duration: formatStopDuration(step.duration) })
                          : t('tours.detail.stop', 'Stop')}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-foreground leading-snug">
                    {step.title}
                  </h3>

                  {/* Description */}
                  {step.description && (
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
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
  );
};

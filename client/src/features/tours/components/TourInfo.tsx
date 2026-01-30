'use client';

import { Clock, Users, Mountain, Map } from 'lucide-react';
import type { Tour } from '@/features/tours/types/tour.types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface TourInfoProps {
  tour: Tour;
  className?: string;
}

export const TourInfo = ({ tour, className }: TourInfoProps) => {
  return (
    <div className={cn('space-y-8', className)}>
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tour.durationMinutes && (
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-card border shadow-sm">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Duration
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
              Group Size
            </span>
            <span className="font-medium text-foreground">
              Up to {tour.maxPeople}
            </span>
          </div>
        )}

        {tour.difficulty && (
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-card border shadow-sm">
            <Mountain className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Difficulty
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
              Start
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
          About this Experience
        </h2>
        <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
          <p className="whitespace-pre-line">
            {tour.description || tour.summary || 'No description available.'}
          </p>
        </div>
      </div>
    </div>
  );
};

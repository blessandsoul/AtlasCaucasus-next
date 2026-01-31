'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, ShieldCheck } from 'lucide-react';
import type { Tour } from '@/features/tours/types/tour.types';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format';
import { ChatButton } from '@/features/chat/components/ChatButton';

interface TourSidebarProps {
  tour: Tour;
  className?: string;
  onBook?: () => void;
}

export const TourSidebar = ({ tour, className, onBook }: TourSidebarProps) => {
  const price = parseFloat(tour.price);
  const originalPrice = tour.originalPrice ? parseFloat(tour.originalPrice) : null;
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <Card
      className={cn(
        'border-none shadow-lg bg-card/50 backdrop-blur-sm sticky top-24',
        className
      )}
    >
      <CardHeader className="space-y-1 pb-4">
        {hasDiscount && (
          <div className="flex items-center justify-between mb-2">
            <Badge variant="destructive" className="font-bold">
              Save {discountPercent}%
            </Badge>
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(originalPrice, tour.currency)}
            </span>
          </div>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">
            {formatCurrency(price, tour.currency)}
          </span>
          <span className="text-muted-foreground">/ person</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          {tour.isInstantBooking && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <Zap className="h-4 w-4 fill-emerald-100 dark:fill-emerald-900" />
              <span className="font-medium">Instant confirmation</span>
            </div>
          )}
          {tour.hasFreeCancellation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span>Free cancellation up to 24h</span>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          <p>Select a date to check availability</p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full text-lg font-semibold shadow-md active:scale-95 transition-transform"
          onClick={onBook}
        >
          Check Availability
        </Button>
        <ChatButton
          otherUserId={tour.ownerId}
          variant="outline"
          size="lg"
          label="Message Host"
          className="w-full"
        />
      </CardFooter>
    </Card>
  );
};

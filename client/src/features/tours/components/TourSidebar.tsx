'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, ShieldCheck, Send, Calendar, Clock, MessageCircle } from 'lucide-react';
import type { Tour } from '@/features/tours/types/tour.types';
import type { AvailabilityType } from '@/features/tours/types/tour.types';
import { cn } from '@/lib/utils';
import { ChatButton } from '@/features/chat/components/ChatButton';
import { useCurrency } from '@/context/CurrencyContext';

const availabilityLabels: Record<AvailabilityType, string> = {
  DAILY: 'tour_availability.daily',
  WEEKDAYS: 'tour_availability.weekdays',
  WEEKENDS: 'tour_availability.weekends',
  SPECIFIC_DATES: 'tour_availability.specific_dates',
  BY_REQUEST: 'tour_availability.by_request',
};

function AvailabilityInfo({ tour }: { tour: Tour }): React.ReactElement {
  const { t } = useTranslation();
  const type = tour.availabilityType ?? 'BY_REQUEST';

  const formatDateChip = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="text-sm bg-muted/50 p-3 rounded-md space-y-2">
      <div className="flex items-center gap-2 text-foreground font-medium">
        <Calendar className="h-4 w-4 text-primary" />
        <span>{t(availabilityLabels[type])}</span>
      </div>

      {type === 'SPECIFIC_DATES' && tour.availableDates && tour.availableDates.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tour.availableDates.slice(0, 6).map((dateStr) => (
            <span
              key={dateStr}
              className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
            >
              {formatDateChip(dateStr)}
            </span>
          ))}
          {tour.availableDates.length > 6 && (
            <span className="inline-block px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs">
              +{tour.availableDates.length - 6} {t('tour_availability.more')}
            </span>
          )}
        </div>
      )}

      {tour.startTime && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{t('tour_availability.starts_at', { time: tour.startTime })}</span>
        </div>
      )}
    </div>
  );
}

interface TourSidebarProps {
  tour: Tour;
  className?: string;
  onBook?: () => void;
  onAskQuestion?: () => void;
}

export const TourSidebar = ({ tour, className, onBook, onAskQuestion }: TourSidebarProps) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
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
              {formatPrice(originalPrice, tour.currency)}
            </span>
          </div>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">
            {formatPrice(price, tour.currency)}
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

        <AvailabilityInfo tour={tour} />
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full text-lg font-semibold shadow-md active:scale-95 transition-transform"
          onClick={onBook}
        >
          <Send className="mr-2 h-4 w-4" />
          {tour.availabilityType === 'BY_REQUEST'
            ? t('bookings.request_booking', 'Request Booking')
            : t('bookings.book_now', 'Book Now')}
        </Button>
        {onAskQuestion && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={onAskQuestion}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {t('bookings.ask_question', 'Ask a Question')}
          </Button>
        )}
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

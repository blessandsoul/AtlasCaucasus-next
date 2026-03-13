'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Zap, ShieldCheck, Calendar, Clock, MessageCircle } from 'lucide-react';
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
    <div className="text-sm space-y-2">
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

export const TourSidebar = ({ tour, className, onBook, onAskQuestion }: TourSidebarProps): React.ReactElement => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const price = parseFloat(tour.price);
  const originalPrice = tour.originalPrice ? parseFloat(tour.originalPrice) : null;
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div
      className={cn(
        'hidden lg:block sticky top-24 rounded-xl border bg-card p-6 shadow-lg',
        className
      )}
    >
      {/* Price section */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">From</span>
          <span className="text-3xl font-bold text-foreground">
            {formatPrice(price, tour.currency)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">per adult</span>
          {hasDiscount && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice, tour.currency)}
              </span>
              <Badge variant="destructive" className="text-xs">
                -{discountPercent}%
              </Badge>
            </>
          )}
        </div>
      </div>

      <Separator className="my-5" />

      {/* Availability */}
      <AvailabilityInfo tour={tour} />

      <Separator className="my-5" />

      {/* Cancellation policy */}
      {tour.hasFreeCancellation && (
        <>
          <div className="flex items-start gap-3 text-sm">
            <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Cancellation policy</span>
              <p className="text-muted-foreground mt-1">
                Cancel anytime before your experience for a full refund.
              </p>
            </div>
          </div>
          <Separator className="my-5" />
        </>
      )}

      {/* Instant confirmation */}
      {tour.isInstantBooking && (
        <>
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <Zap className="h-4 w-4" />
            <span className="font-medium">Instant confirmation</span>
          </div>
          <Separator className="my-5" />
        </>
      )}

      {/* Secondary actions */}
      <div className="space-y-2">
        {onAskQuestion && (
          <Button
            variant="outline"
            size="default"
            className="w-full"
            onClick={onAskQuestion}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {t('bookings.ask_question', 'Ask a question')}
          </Button>
        )}
        <ChatButton
          otherUserId={tour.ownerId}
          variant="ghost"
          size="default"
          label="Message Host"
          className="w-full text-muted-foreground hover:text-foreground"
        />
      </div>

      {/* Primary CTA — at the bottom */}
      <Button
        size="lg"
        className="w-full text-base font-semibold h-12 rounded-full shadow-md active:scale-[0.98] transition-all mt-5"
        onClick={onBook}
      >
        {tour.availabilityType === 'BY_REQUEST'
          ? t('bookings.request_booking', 'Request Booking')
          : t('bookings.reserve_now', 'Reserve Now')}
      </Button>
    </div>
  );
};

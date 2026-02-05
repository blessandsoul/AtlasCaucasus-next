'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Guide } from '../types/guide.types';

interface GuideSidebarProps {
  guide: Guide;
  onBook?: () => void;
  className?: string;
}

import { useTranslation } from 'react-i18next'; // Added import

export const GuideSidebar = ({ guide, onBook, className }: GuideSidebarProps) => {
  const { t } = useTranslation(); // Added hook
  const price = guide.pricePerDay ? Number(guide.pricePerDay) : null;
  const currency = guide.currency || 'USD';

  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleBook = () => {
    if (onBook) {
      onBook();
    } else {
      console.log('Book guide:', guide.id);
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl md:relative md:rounded-2xl md:border md:shadow-sm',
        className
      )}
    >
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-0.5">
              {t('guide_details.starting_from')}
            </span>
            {price ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-bold text-foreground">
                  {formatPrice(price, currency)}
                </span>
                <span className="text-muted-foreground text-sm">/{t('guide_details.per_day')}</span>
              </div>
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {t('guide_details.contact_for_price')}
              </span>
            )}
          </div>

          <Button
            size="lg"
            onClick={handleBook}
            className="bg-cyan-500 hover:bg-cyan-600 text-white dark:text-black font-semibold rounded-full px-8 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
          >
            {t('guide_details.book_now')}
          </Button>
        </div>
      </div>
    </div>
  );
};

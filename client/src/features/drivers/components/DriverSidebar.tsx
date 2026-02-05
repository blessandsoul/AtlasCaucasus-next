'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Driver } from '../types/driver.types';

interface DriverSidebarProps {
  driver: Driver;
  onBook?: () => void;
  className?: string;
}

import { useTranslation } from 'react-i18next';

export const DriverSidebar = ({
  driver,
  onBook,
  className,
}: DriverSidebarProps) => {
  const { t } = useTranslation();
  const price = driver.pricePerDay ? Number(driver.pricePerDay) : null;
  const currency = driver.currency || 'USD';

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
      console.log('Book driver:', driver.id);
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
              {t('driver_details.sidebar.daily_rate', 'Daily Rate')}
            </span>
            {price ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-bold text-foreground">
                  {formatPrice(price, currency)}
                </span>
                <span className="text-muted-foreground text-sm">/ {t('driver_details.about.availability', 'day')}</span>
              </div>
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {t('driver_details.sidebar.contact_for_price', 'Contact for price')}
              </span>
            )}
          </div>

          <Button
            size="lg"
            onClick={handleBook}
            className="bg-cyan-500 hover:bg-cyan-600 text-white dark:text-black font-semibold rounded-full px-8 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
          >
            {t('driver_details.sidebar.book_now', 'Book Now')}
          </Button>
        </div>

        <p className="hidden md:block text-xs text-muted-foreground mt-4 text-center">
          {t('driver_details.sidebar.fuel_disclaimer', 'Vehicle fuel typically not included unless stated otherwise.')}
        </p>
      </div>
    </div>
  );
};

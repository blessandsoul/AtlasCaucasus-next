'use client';

import { useTranslation } from 'react-i18next';
import { Send, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Driver } from '../types/driver.types';
import { formatResponseTime } from '@/lib/utils/format';
import { useCurrency } from '@/context/CurrencyContext';

interface DriverSidebarProps {
  driver: Driver;
  onBook?: () => void;
  className?: string;
}

export const DriverSidebar = ({
  driver,
  onBook,
  className,
}: DriverSidebarProps) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const price = driver.pricePerDay ? Number(driver.pricePerDay) : null;
  const currency = driver.currency || 'GEL';
  const responseTime = formatResponseTime(driver.avgResponseTimeMinutes);

  const handleBook = (): void => {
    if (onBook) {
      onBook();
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
        {/* Provider Trust Badges - Desktop only */}
        {(driver.isVerified || responseTime) && (
          <div className="hidden md:flex items-center flex-wrap gap-2 mb-4 pb-4 border-b border-border">
            {driver.isVerified && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('provider_badges.verified', 'Verified')}
              </span>
            )}
            {responseTime && (
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                responseTime.variant === 'success' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                responseTime.variant === 'warning' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                responseTime.variant === 'muted' && 'bg-muted text-muted-foreground',
              )}>
                <Clock className="h-3.5 w-3.5" />
                {t('provider_badges.responds', 'Responds')} {responseTime.label}
              </span>
            )}
          </div>
        )}

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
            <Send className="mr-2 h-4 w-4" />
            {t('inquiry_dialog.request_driver')}
          </Button>
        </div>

        <p className="hidden md:block text-xs text-muted-foreground mt-4 text-center">
          {t('driver_details.sidebar.fuel_disclaimer', 'Vehicle fuel typically not included unless stated otherwise.')}
        </p>
      </div>
    </div>
  );
};

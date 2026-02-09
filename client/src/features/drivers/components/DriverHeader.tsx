'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star,
  MapPin,
  Car,
  MessageCircle,
  Phone,
  Users,
  ShieldCheck,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/common/ShareButton';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media';
import { formatResponseTime } from '@/lib/utils/format';
import type { Driver } from '../types/driver.types';
import { useCreateDirectChat } from '@/features/chat/hooks/useChats';
import { selectChat } from '@/features/chat/store/chatSlice';
import { useAppDispatch } from '@/store/hooks';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';

interface DriverHeaderProps {
  driver: Driver;
  className?: string;
}

import { useTranslation } from 'react-i18next';

export const DriverHeader = ({ driver, className }: DriverHeaderProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const createChat = useCreateDirectChat();
  const [isLoading, setIsLoading] = useState(false);

  const fullName = driver.user
    ? `${driver.user.firstName} ${driver.user.lastName}`
    : t('driver_details.unknown_driver', 'Unknown Driver');

  // Use avatarUrl first, fallback to photoUrl
  const photoUrl = getMediaUrl(driver.avatarUrl || driver.photoUrl);
  const rating = driver.averageRating ? parseFloat(driver.averageRating) : null;

  const getLocations = (): Location[] => {
    if (!driver.locations || driver.locations.length === 0) return [];

    const firstItem = driver.locations[0];
    if ('location' in firstItem && (firstItem as any).location) {
      return (driver.locations as any[])
        .filter((dl) => dl.location)
        .map((dl) => dl.location as Location);
    }

    return driver.locations as Location[];
  };

  const locations = getLocations();
  const primaryLocation = locations[0];

  const handleSendMessage = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to send a message');
      router.push('/login');
      return;
    }

    if (user?.id === driver.userId) {
      toast.error("You can't message yourself");
      return;
    }

    setIsLoading(true);
    try {
      const chat = await createChat.mutateAsync({ otherUserId: driver.userId });
      dispatch(selectChat(chat.id));
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, driver.userId, createChat, dispatch, router]);

  const handleCall = () => {
    if (driver.phoneNumber) {
      window.location.href = `tel:${driver.phoneNumber}`;
    }
  };

  return (
    <div
      className={cn(
        'bg-card rounded-2xl shadow-sm border border-border overflow-hidden',
        className
      )}
    >
      <div className="p-6 md:p-8">
        <div className="flex flex-col items-center md:items-stretch md:flex-row gap-6 md:gap-8">
          <div className="relative shrink-0">
            <div className="w-44 h-44 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-background shadow-lg">
              <img
                src={photoUrl}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 w-full flex flex-col items-center md:items-stretch">
            <div className="flex flex-col items-center md:items-start md:flex-row md:justify-between gap-4 w-full flex-1">
              <div className="flex flex-col items-center md:items-start justify-between h-full flex-1">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
                      {fullName}
                    </h1>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    {driver.isVerified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-500/20" title={t('provider_badges.verified_tooltip', 'This provider has been verified by AtlasCaucasus for identity and quality.')}>
                        <ShieldCheck className="h-4 w-4" />
                        {t('provider_badges.verified', 'Verified')}
                      </span>
                    )}
                    {(() => {
                      const rt = formatResponseTime(driver.avgResponseTimeMinutes);
                      if (!rt) return null;
                      return (
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
                          rt.variant === 'success' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                          rt.variant === 'warning' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                          rt.variant === 'muted' && 'bg-muted text-muted-foreground border-border',
                        )}>
                          <Clock className="h-4 w-4" />
                          {t('provider_badges.responds', 'Responds')} {rt.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-start gap-2">
                  {primaryLocation && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                      <span>
                        {primaryLocation.name || primaryLocation.city}
                        {primaryLocation.country && `, ${primaryLocation.country}`}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                      <Car className="h-3.5 w-3.5 text-cyan-500" />
                      <span>{driver.vehicleType}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                      <Users className="h-3.5 w-3.5 text-cyan-500" />
                      <span>{driver.vehicleCapacity} {t('driver_details.seats', 'Seats')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-bold text-foreground">
                    {rating ? rating.toFixed(1) : t('driver_details.new', 'New')}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {driver.reviewCount > 0
                    ? t('driver_details.review_count', '{{count}} reviews', { count: driver.reviewCount })
                    : t('driver_details.no_reviews', 'No reviews yet')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            size="lg"
            className="w-full sm:flex-1 bg-cyan-500 hover:bg-cyan-600 text-white dark:text-black font-semibold rounded-full shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
            onClick={handleSendMessage}
            disabled={isLoading || createChat.isPending}
          >
            {isLoading || createChat.isPending ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <MessageCircle className="h-5 w-5 mr-2" />
            )}
            {t('driver_details.send_message', 'Send Message')}
          </Button>
          {driver.phoneNumber && (
            <Button
              size="lg"
              variant="outline"
              className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-semibold"
              onClick={handleCall}
            >
              <Phone className="h-5 w-5 mr-2" />
              {t('driver_details.call', 'Call')}
            </Button>
          )}
          <ShareButton
            url={`/explore/drivers/${driver.id}`}
            title={fullName}
            description={driver.bio || undefined}
          />
        </div>
      </div>
    </div>
  );
};

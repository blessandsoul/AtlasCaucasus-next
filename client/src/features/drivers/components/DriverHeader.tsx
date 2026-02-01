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
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media';
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

export const DriverHeader = ({ driver, className }: DriverHeaderProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const createChat = useCreateDirectChat();
  const [isLoading, setIsLoading] = useState(false);

  const fullName = driver.user
    ? `${driver.user.firstName} ${driver.user.lastName}`
    : 'Unknown Driver';

  // Use avatarUrl first, fallback to photoUrl
  const photoUrl = getMediaUrl(driver.avatarUrl || driver.photoUrl);
  const rating = driver.averageRating ? parseFloat(driver.averageRating) : null;

  const primaryLocation = driver.locations?.[0];

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
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="relative shrink-0">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-background shadow-lg">
              <img
                src={photoUrl}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
                    {fullName}
                  </h1>
                  {driver.isVerified && (
                    <CheckCircle2 className="h-6 w-6 text-cyan-500 shrink-0" />
                  )}
                </div>

                {driver.bio && (
                  <p className="text-muted-foreground text-sm md:text-base mb-3 line-clamp-2 md:line-clamp-3">
                    {driver.bio}
                  </p>
                )}

                {primaryLocation && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                    <MapPin className="h-4 w-4 text-cyan-500" />
                    <span>{primaryLocation.city}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                    <Car className="h-3.5 w-3.5 text-cyan-500" />
                    <span>{driver.vehicleType}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                    <Users className="h-3.5 w-3.5 text-cyan-500" />
                    <span>{driver.vehicleCapacity} Seats</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-bold text-foreground">
                    {rating ? rating.toFixed(1) : 'New'}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {driver.reviewCount > 0 ? `${driver.reviewCount} review${driver.reviewCount !== 1 ? 's' : ''}` : 'No reviews yet'}
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
            Send Message
          </Button>
          {driver.phoneNumber && (
            <Button
              size="lg"
              variant="outline"
              className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-semibold"
              onClick={handleCall}
            >
              <Phone className="h-5 w-5 mr-2" />
              Call
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

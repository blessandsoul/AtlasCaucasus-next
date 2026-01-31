'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star,
  MapPin,
  Clock,
  MessageCircle,
  Phone,
  Globe,
  Award,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media';
import type { Guide, Location, GuideLocation } from '../types/guide.types';
import { useCreateDirectChat } from '@/features/chat/hooks/useChats';
import { selectChat } from '@/features/chat/store/chatSlice';
import { useAppDispatch } from '@/store/hooks';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';

interface GuideHeaderProps {
  guide: Guide;
  className?: string;
}

export const GuideHeader = ({ guide, className }: GuideHeaderProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const createChat = useCreateDirectChat();
  const [isLoading, setIsLoading] = useState(false);

  const fullName = guide.user
    ? `${guide.user.firstName} ${guide.user.lastName}`
    : 'Unknown Guide';

  const photoUrl = getMediaUrl(guide.photoUrl);
  const rating = guide.averageRating ? parseFloat(guide.averageRating) : null;

  const getLocations = (): Location[] => {
    if (!guide.locations || guide.locations.length === 0) return [];

    const firstItem = guide.locations[0];
    if ('location' in firstItem && (firstItem as GuideLocation).location) {
      return (guide.locations as GuideLocation[])
        .filter((gl) => gl.location)
        .map((gl) => gl.location as Location);
    }

    return guide.locations as Location[];
  };

  const locations = getLocations();
  const primaryLocation = locations[0];

  const handleSendMessage = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to send a message');
      router.push('/login');
      return;
    }

    if (user?.id === guide.userId) {
      toast.error("You can't message yourself");
      return;
    }

    setIsLoading(true);
    try {
      const chat = await createChat.mutateAsync({ otherUserId: guide.userId });
      dispatch(selectChat(chat.id));
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, guide.userId, createChat, dispatch, router]);

  const handleCall = () => {
    if (guide.phoneNumber) {
      window.location.href = `tel:${guide.phoneNumber}`;
    }
  };

  const getLanguages = (): string[] => {
    if (!guide.languages) return [];
    if (Array.isArray(guide.languages)) return guide.languages;
    if (typeof guide.languages === 'string') {
      try {
        const parsed = JSON.parse(guide.languages);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const languagesArray = getLanguages();

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
                  {guide.isVerified && (
                    <CheckCircle2 className="h-6 w-6 text-cyan-500 shrink-0" />
                  )}
                </div>

                {guide.bio && (
                  <p className="text-muted-foreground text-sm md:text-base mb-3 line-clamp-2 md:line-clamp-3">
                    {guide.bio}
                  </p>
                )}

                {primaryLocation && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                    <MapPin className="h-4 w-4 text-cyan-500" />
                    <span>
                      {primaryLocation.name}
                      {primaryLocation.country && `, ${primaryLocation.country}`}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {guide.yearsOfExperience && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                      <Clock className="h-3.5 w-3.5 text-cyan-500" />
                      <span>{guide.yearsOfExperience} years exp.</span>
                    </div>
                  )}
                  {languagesArray.length > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                      <Globe className="h-3.5 w-3.5 text-cyan-500" />
                      <span>{languagesArray.slice(0, 3).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-bold text-foreground">
                    {rating ? rating.toFixed(1) : '-'}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {guide.reviewCount} reviews
                </span>
              </div>
            </div>
          </div>
        </div>

        {languagesArray.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
            <Award className="h-5 w-5 text-amber-500 mr-1" />
            {languagesArray.map((lang, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
              >
                {lang}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            size="lg"
            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white dark:text-black font-semibold rounded-full shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
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
          {guide.phoneNumber && (
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

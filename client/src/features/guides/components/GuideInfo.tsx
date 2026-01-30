'use client';

import { useState } from 'react';
import {
  Award,
  Shield,
  Users,
  Car,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ImageGallery } from '@/components/common/ImageGallery';
import type { Guide, Location, GuideLocation } from '../types/guide.types';

interface GuideInfoProps {
  guide: Guide;
  className?: string;
}

const AchievementBadge = ({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) => (
  <div className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-xl border border-border/50 min-w-[120px]">
    <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
      <Icon className="h-5 w-5 text-cyan-500" />
    </div>
    <span className="text-xs font-medium text-muted-foreground text-center">
      {label}
    </span>
  </div>
);

const AvailabilityDay = ({
  day,
  available,
}: {
  day: string;
  available: boolean;
}) => (
  <div
    className={cn(
      'w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
      available ? 'bg-cyan-500 text-white' : 'bg-muted text-muted-foreground'
    )}
  >
    {day}
  </div>
);

export const GuideInfo = ({ guide, className }: GuideInfoProps) => {
  const [activeTab, setActiveTab] = useState('about');
  const photos = guide.photos || [];

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

  const getSpecializations = (): string[] => {
    const specs: string[] = [];
    const bioLower = guide.bio?.toLowerCase() || '';

    if (
      bioLower.includes('mountain') ||
      bioLower.includes('hiking') ||
      bioLower.includes('trekking')
    ) {
      specs.push('Mountain Tours');
    }
    if (
      bioLower.includes('wine') ||
      bioLower.includes('vineyard') ||
      bioLower.includes('kakheti')
    ) {
      specs.push('Wine Tours');
    }
    if (
      bioLower.includes('cultural') ||
      bioLower.includes('history') ||
      bioLower.includes('heritage')
    ) {
      specs.push('Cultural Heritage');
    }
    if (bioLower.includes('photo') || bioLower.includes('camera')) {
      specs.push('Photography');
    }

    if (specs.length === 0) {
      specs.push('Private Tours');
      specs.push('City Tours');
    }

    return specs;
  };

  const specializations = getSpecializations();

  const availability = {
    Mon: guide.isAvailable,
    Tue: guide.isAvailable,
    Wed: guide.isAvailable,
    Thu: guide.isAvailable,
    Fri: guide.isAvailable,
    Sat: guide.isAvailable,
    Sun: false,
  };

  const getAchievements = () => {
    const achievements = [];

    if (guide.isVerified) {
      achievements.push({
        icon: Shield,
        label: 'Verified Identity',
      });
    }

    if (guide.yearsOfExperience && guide.yearsOfExperience >= 5) {
      achievements.push({
        icon: Award,
        label: 'Top Rated 2024',
      });
    }

    if (guide.reviewCount >= 100) {
      achievements.push({
        icon: Users,
        label: `${Math.floor(guide.reviewCount * 5)}+ Tours`,
      });
    }

    if (achievements.length < 3) {
      achievements.push({
        icon: Car,
        label: 'Has Vehicle',
      });
    }

    return achievements;
  };

  const achievements = getAchievements();

  return (
    <div
      className={cn(
        'bg-card rounded-2xl shadow-sm border border-border overflow-hidden',
        className
      )}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-border">
          <TabsList className="w-full justify-start bg-transparent h-auto p-0 rounded-none">
            <TabsTrigger
              value="about"
              className="flex-1 md:flex-none px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-500"
            >
              About
            </TabsTrigger>
            {photos.length > 0 && (
              <TabsTrigger
                value="photos"
                className="flex-1 md:flex-none px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-500"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Photos
                </div>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="tours"
              className="flex-1 md:flex-none px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-500"
            >
              Tours
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex-1 md:flex-none px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-500"
            >
              Reviews
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="about" className="p-6 md:p-8 mt-0">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">About</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {guide.bio || 'No bio available.'}
            </p>
          </div>

          {achievements.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-3">
                {achievements.map((achievement, index) => (
                  <AchievementBadge
                    key={index}
                    icon={achievement.icon}
                    label={achievement.label}
                  />
                ))}
              </div>
            </div>
          )}

          {specializations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Specializations
              </h3>
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-full text-sm font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {locations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Operating Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {locations.map((loc, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm text-muted-foreground"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {loc.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Availability
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(availability).map(([day, available]) => (
                <AvailabilityDay key={day} day={day} available={available} />
              ))}
            </div>
          </div>
        </TabsContent>

        {photos.length > 0 && (
          <TabsContent value="photos" className="p-6 md:p-8 mt-0">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Guide Photos
              </h3>
              <ImageGallery
                images={photos.map((p) => ({
                  id: p.id,
                  url: p.url,
                  alt: p.originalName || 'Guide Photo',
                }))}
                columns={3}
                aspectRatio="video"
              />
            </div>
          </TabsContent>
        )}

        <TabsContent value="tours" className="p-6 md:p-8 mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Tours Yet
            </h3>
            <p className="text-muted-foreground max-w-sm">
              This guide hasn&apos;t listed any tours yet. Contact them directly
              to arrange a custom tour.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="p-6 md:p-8 mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Reviews Yet
            </h3>
            <p className="text-muted-foreground max-w-sm">
              Be the first to review this guide after your tour experience.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

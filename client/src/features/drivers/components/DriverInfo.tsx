'use client';

import { useState } from 'react';
import {
  Shield,
  Users,
  MapPin,
  Car,
  Image as ImageIcon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ImageGallery } from '@/components/common/ImageGallery';
import { ReviewsSection } from '@/features/reviews';
import type { Driver } from '../types/driver.types';

interface DriverInfoProps {
  driver: Driver;
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

import { useTranslation } from 'react-i18next';

export const DriverInfo = ({ driver, className }: DriverInfoProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('about');

  const photos = driver.photos || [];
  const locations = driver.locations || [];

  const availability = {
    Mon: driver.isAvailable,
    Tue: driver.isAvailable,
    Wed: driver.isAvailable,
    Thu: driver.isAvailable,
    Fri: driver.isAvailable,
    Sat: driver.isAvailable,
    Sun: driver.isAvailable,
  };

  const getAchievements = () => {
    const achievements = [];

    if (driver.isVerified) {
      achievements.push({
        icon: Shield,
        label: t('driver_details.verified_driver', 'Verified Driver'),
      });
    }

    achievements.push({
      icon: Car,
      label: driver.vehicleType,
    });

    achievements.push({
      icon: Users,
      label: t('driver_details.up_to_pax', 'Up to {{count}} pax', { count: driver.vehicleCapacity }),
    });

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
              {t('driver_details.tabs.about', 'About & Vehicle')}
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex-1 md:flex-none px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-500"
            >
              {t('driver_details.tabs.reviews', 'Reviews')}
            </TabsTrigger>
            {photos.length > 0 && (
              <TabsTrigger
                value="photos"
                className="flex-1 md:flex-none px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-500"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {t('driver_details.tabs.photos', 'Photos')}
                </div>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="about" className="p-6 md:p-8 mt-0">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('driver_details.about.title', 'About Driver')}
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {driver.bio || t('driver_details.about.no_bio', 'No bio available.')}
            </p>
          </div>

          <div className="mb-8 p-6 bg-muted/30 rounded-xl border border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Car className="h-5 w-5 text-cyan-500" />
              {t('driver_details.about.vehicle_details', 'Vehicle Details')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  {t('driver_details.about.make_model', 'Vehicle Make & Model')}
                </span>
                <span className="font-medium">
                  {driver.vehicleMake} {driver.vehicleModel}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{t('driver_details.about.year', 'Year')}</span>
                <span className="font-medium">{driver.vehicleYear}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{t('driver_details.about.type', 'Type')}</span>
                <span className="font-medium">{driver.vehicleType}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{t('driver_details.about.capacity', 'Capacity')}</span>
                <span className="font-medium">
                  {driver.vehicleCapacity} {t('driver_details.about.passengers', 'Passengers')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  {t('driver_details.about.license_plate', 'License Plate')}
                </span>
                <span className="font-medium">{driver.licenseNumber}</span>
              </div>
            </div>
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

          {locations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {t('driver_details.about.operating_areas', 'Operating Areas')}
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
              {t('driver_details.about.availability', 'Availability')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(availability).map(([day, available]) => (
                <AvailabilityDay key={day} day={day} available={available} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-0">
          <ReviewsSection
            targetType="DRIVER"
            targetId={driver.id}
            className="border-0 shadow-none"
          />
        </TabsContent>

        {photos.length > 0 && (
          <TabsContent value="photos" className="p-6 md:p-8 mt-0">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {t('driver_details.about.vehicle_driver_photos', 'Vehicle & Driver Photos')}
              </h3>
              <ImageGallery
                images={photos.map((p) => ({
                  id: p.id,
                  url: p.url,
                  alt: p.originalName || 'Driver Photo',
                }))}
                columns={3}
                aspectRatio="video"
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

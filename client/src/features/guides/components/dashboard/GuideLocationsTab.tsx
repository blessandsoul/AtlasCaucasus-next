'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Loader2, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyGuide, useUpdateGuide } from '../../hooks/useGuides';
import { useLocations } from '@/features/locations/hooks/useLocations';
import { getErrorMessage } from '@/lib/utils/error';
import type { Location } from '@/features/locations/types/location.types';

export const GuideLocationsTab = (): React.ReactElement | null => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data: guide, isLoading: guideLoading, error: guideError, refetch } = useMyGuide();
  const { data: locationsData, isLoading: locationsLoading } = useLocations({ limit: 200 });
  const updateMutation = useUpdateGuide();

  const allLocations: Location[] = useMemo(() => {
    if (!locationsData?.items) return [];
    return locationsData.items.filter((loc: Location) => loc.isActive);
  }, [locationsData]);

  const currentLocationIds = useMemo(() => {
    if (!guide?.locations) return new Set<string>();
    return new Set(
      (guide.locations as Array<{ id?: string; locationId?: string }>).map(
        (loc) => loc.id || loc.locationId || ''
      ).filter(Boolean)
    );
  }, [guide?.locations]);

  const filteredLocations = useMemo(() => {
    if (!search.trim()) return allLocations;
    const q = search.toLowerCase();
    return allLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        (loc.region && loc.region.toLowerCase().includes(q)) ||
        loc.country.toLowerCase().includes(q)
    );
  }, [allLocations, search]);

  const handleToggleLocation = async (locationId: string): Promise<void> => {
    if (!guide) return;

    const newIds = new Set(currentLocationIds);
    if (newIds.has(locationId)) {
      newIds.delete(locationId);
    } else {
      newIds.add(locationId);
    }

    await updateMutation.mutateAsync({
      id: guide.id,
      data: { locationIds: Array.from(newIds) },
    });
  };

  if (guideLoading || locationsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (guideError) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">{t('common.error', 'Error')}</CardTitle>
          <CardDescription>{getErrorMessage(guideError)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => refetch()}>
            {t('common.try_again', 'Try Again')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!guide) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('guide.locations.title', 'Manage Locations')}
          </CardTitle>
          <CardDescription>
            {t(
              'guide.locations.subtitle',
              'Select the locations where you offer guide services'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('guide.locations.search_placeholder', 'Search locations...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {currentLocationIds.size > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('guide.locations.selected_count', '{{count}} location(s) selected', {
                count: currentLocationIds.size,
              })}
            </p>
          )}

          {filteredLocations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('guide.locations.no_locations', 'No locations found')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredLocations.map((location) => {
                const isSelected = currentLocationIds.has(location.id);
                return (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => handleToggleLocation(location.id)}
                    disabled={updateMutation.isPending}
                    className={`
                      flex items-center gap-3 rounded-lg border p-3 text-left
                      transition-all duration-200
                      ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div
                      className={`
                        flex h-5 w-5 shrink-0 items-center justify-center rounded border
                        transition-colors duration-200
                        ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        }
                      `}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{location.name}</p>
                      {location.region && (
                        <p className="text-xs text-muted-foreground truncate">
                          {location.region}, {location.country}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

'use client';

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocations } from '@/features/locations/hooks/useLocations';
import type { EntityType } from './EntityTypeTabs';

interface ActiveFilterChipsProps {
    type: EntityType;
}

interface FilterChip {
    key: string;
    label: string;
    value: string;
}

export const ActiveFilterChips = ({ type }: ActiveFilterChipsProps): React.ReactElement | null => {
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { data: locationsData } = useLocations({ limit: 100 });
    const locations = locationsData?.items || [];

    const chips = useMemo((): FilterChip[] => {
        const result: FilterChip[] = [];

        const search = searchParams.get('search');
        if (search) {
            result.push({
                key: 'search',
                label: t('explore_page.filters.search', 'Search'),
                value: search,
            });
        }

        const locationId = searchParams.get('locationId');
        if (locationId) {
            const location = locations.find(loc => loc.id === locationId);
            result.push({
                key: 'locationId',
                label: t('explore_page.filters.location', 'Location'),
                value: location?.name || locationId,
            });
        }

        const sortBy = searchParams.get('sortBy');
        if (sortBy) {
            const sortLabels: Record<string, string> = {
                newest: t('explore_page.filters.sort_newest', 'Newest'),
                rating: t('explore_page.filters.sort_rating', 'Highest Rated'),
                price: t('explore_page.filters.sort_price_low', 'Price: Low to High'),
                price_desc: t('explore_page.filters.sort_price_high', 'Price: High to Low'),
                experience: t('explore_page.filters.sort_experience', 'Most Experienced'),
                capacity: t('explore_page.filters.sort_capacity', 'Largest Capacity'),
                name: t('explore_page.filters.sort_name', 'Name A-Z'),
            };
            result.push({
                key: 'sortBy',
                label: t('explore_page.filters.sort_by', 'Sort By'),
                value: sortLabels[sortBy] || sortBy,
            });
        }

        const minRating = searchParams.get('minRating');
        if (minRating) {
            result.push({
                key: 'minRating',
                label: t('explore_page.filters.min_rating', 'Min Rating'),
                value: `${minRating}+`,
            });
        }

        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        if (minPrice || maxPrice) {
            let value = '';
            if (minPrice && maxPrice) {
                value = `${minPrice} – ${maxPrice}`;
            } else if (minPrice) {
                value = `${minPrice}+`;
            } else if (maxPrice) {
                value = `≤ ${maxPrice}`;
            }
            result.push({
                key: 'price',
                label: t('explore_page.filters.price_range', 'Price'),
                value,
            });
        }

        // Tour-specific
        if (type === 'tours') {
            const dateFrom = searchParams.get('dateFrom');
            const dateTo = searchParams.get('dateTo');
            if (dateFrom || dateTo) {
                const fmt = (d: string): string => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                let value = '';
                if (dateFrom && dateTo) {
                    value = `${fmt(dateFrom)} – ${fmt(dateTo)}`;
                } else if (dateFrom) {
                    value = `${fmt(dateFrom)} –`;
                } else if (dateTo) {
                    value = `– ${fmt(dateTo)}`;
                }
                result.push({
                    key: 'dateRange',
                    label: t('explore_page.filters.date', 'Date'),
                    value,
                });
            }

            const difficulty = searchParams.get('difficulty');
            if (difficulty) {
                const diffLabels: Record<string, string> = {
                    easy: t('explore_page.filters.difficulty_easy', 'Easy'),
                    moderate: t('explore_page.filters.difficulty_moderate', 'Moderate'),
                    challenging: t('explore_page.filters.difficulty_challenging', 'Challenging'),
                };
                result.push({
                    key: 'difficulty',
                    label: t('explore_page.filters.difficulty', 'Difficulty'),
                    value: diffLabels[difficulty] || difficulty,
                });
            }

            const minDuration = searchParams.get('minDuration');
            const maxDuration = searchParams.get('maxDuration');
            if (minDuration || maxDuration) {
                let value = '';
                if (minDuration && maxDuration) {
                    value = `${minDuration} – ${maxDuration} min`;
                } else if (minDuration) {
                    value = `${minDuration}+ min`;
                } else if (maxDuration) {
                    value = `≤ ${maxDuration} min`;
                }
                result.push({
                    key: 'duration',
                    label: t('explore_page.filters.duration', 'Duration'),
                    value,
                });
            }

            const maxPeople = searchParams.get('maxPeople');
            if (maxPeople) {
                result.push({
                    key: 'maxPeople',
                    label: t('explore_page.filters.group_size', 'Group Size'),
                    value: `${maxPeople}+`,
                });
            }
        }

        // Guide-specific
        if (type === 'guides') {
            const language = searchParams.get('language');
            if (language) {
                const langLabels: Record<string, string> = {
                    en: 'English', ka: 'Georgian', ru: 'Russian',
                    de: 'German', fr: 'French', es: 'Spanish',
                    it: 'Italian', zh: 'Chinese', ja: 'Japanese', ar: 'Arabic',
                };
                result.push({
                    key: 'language',
                    label: t('explore_page.filters.language', 'Language'),
                    value: langLabels[language] || language,
                });
            }

            const minExperience = searchParams.get('minExperience');
            if (minExperience) {
                result.push({
                    key: 'minExperience',
                    label: t('explore_page.filters.experience', 'Experience'),
                    value: `${minExperience}+ ${t('explore_page.filters.min_years', 'years')}`,
                });
            }
        }

        // Driver-specific
        if (type === 'drivers') {
            const vehicleType = searchParams.get('vehicleType');
            if (vehicleType) {
                const vehicleLabels: Record<string, string> = {
                    sedan: 'Sedan', suv: 'SUV', van: 'Van',
                    minibus: 'Minibus', bus: 'Bus',
                };
                result.push({
                    key: 'vehicleType',
                    label: t('explore_page.filters.vehicle_type', 'Vehicle Type'),
                    value: vehicleLabels[vehicleType] || vehicleType,
                });
            }

            const minCapacity = searchParams.get('minCapacity');
            if (minCapacity) {
                result.push({
                    key: 'minCapacity',
                    label: t('explore_page.filters.min_capacity', 'Min Capacity'),
                    value: `${minCapacity}+`,
                });
            }
        }

        // Company-specific
        if (type === 'companies') {
            const hasActiveTours = searchParams.get('hasActiveTours');
            if (hasActiveTours === 'true') {
                result.push({
                    key: 'hasActiveTours',
                    label: t('explore_page.filters.has_active_tours', 'Has Active Tours'),
                    value: '',
                });
            }
        }

        return result;
    }, [searchParams, type, locations, t]);

    const removeFilter = useCallback((chipKey: string) => {
        const newParams = new URLSearchParams(searchParams.toString());

        if (chipKey === 'price') {
            newParams.delete('minPrice');
            newParams.delete('maxPrice');
        } else if (chipKey === 'duration') {
            newParams.delete('minDuration');
            newParams.delete('maxDuration');
        } else if (chipKey === 'dateRange') {
            newParams.delete('dateFrom');
            newParams.delete('dateTo');
        } else {
            newParams.delete(chipKey);
        }

        newParams.set('page', '1');
        const qs = newParams.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, [searchParams, router, pathname]);

    const clearAll = useCallback(() => {
        router.push(pathname, { scroll: false });
    }, [router, pathname]);

    if (chips.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    type="button"
                    onClick={() => removeFilter(chip.key)}
                    className={cn(
                        "group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
                        "text-xs font-medium",
                        "bg-primary/10 text-primary",
                        "border border-primary/20",
                        "transition-all duration-200 ease-out",
                        "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                    aria-label={`${t('explore_page.filters.clear_all', 'Remove')} ${chip.label}: ${chip.value}`}
                >
                    <span className="text-muted-foreground text-[10px] font-normal uppercase tracking-wider">
                        {chip.label}
                    </span>
                    {chip.value && (
                        <span>{chip.value}</span>
                    )}
                    <X className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                </button>
            ))}

            {chips.length > 1 && (
                <button
                    type="button"
                    onClick={clearAll}
                    className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1.5",
                        "text-xs font-medium",
                        "text-muted-foreground",
                        "transition-colors duration-150",
                        "hover:text-destructive",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                >
                    {t('explore_page.filters.clear_all', 'Clear all')}
                </button>
            )}
        </div>
    );
};

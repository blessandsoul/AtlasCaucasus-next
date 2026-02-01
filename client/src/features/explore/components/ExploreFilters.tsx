'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
    MapPin,
    ChevronDown,
    Search,
    Check,
    SlidersHorizontal,
    Star,
    Clock,
    Users,
    DollarSign,
    Languages,
    Car,
    Building2,
    X
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';
import { useLocations } from '@/features/locations/hooks/useLocations';
import type { EntityType } from './EntityTypeTabs';

interface ExploreFiltersProps {
    type: EntityType;
    className?: string;
}

// Filter section wrapper component
const FilterSection = ({
    icon: Icon,
    label,
    children
}: {
    icon: React.ElementType;
    label: string;
    children: React.ReactNode;
}) => (
    <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Icon className="h-4 w-4" />
            {label}
        </label>
        {children}
    </div>
);

// Shared input styles
const inputStyles = "h-10 w-full rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 300;

export const ExploreFilters = ({ type, className }: ExploreFiltersProps) => {
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [locationOpen, setLocationOpen] = useState(false);
    const [locationSearchQuery, setLocationSearchQuery] = useState('');

    // Local state for debounced inputs
    const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
    const [localMinPrice, setLocalMinPrice] = useState(searchParams.get('minPrice') || '');
    const [localMaxPrice, setLocalMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [localMinDuration, setLocalMinDuration] = useState(searchParams.get('minDuration') || '');
    const [localMaxDuration, setLocalMaxDuration] = useState(searchParams.get('maxDuration') || '');
    const [localMaxPeople, setLocalMaxPeople] = useState(searchParams.get('maxPeople') || '');
    const [localMinExperience, setLocalMinExperience] = useState(searchParams.get('minExperience') || '');
    const [localMinCapacity, setLocalMinCapacity] = useState(searchParams.get('minCapacity') || '');

    // Fetch locations from API
    const { data: locationsData, isLoading: isLoadingLocations } = useLocations({ limit: 100 });

    // Helper to create new URL with updated params
    const createQueryString = useCallback((params: Record<string, string | null>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === '' || value === 'all') {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        // Reset page on filter change
        newParams.set('page', '1');
        return newParams.toString();
    }, [searchParams]);

    // Sync local states with URL params when they change externally (e.g., on clear)
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        const urlMinPrice = searchParams.get('minPrice') || '';
        const urlMaxPrice = searchParams.get('maxPrice') || '';
        const urlMinDuration = searchParams.get('minDuration') || '';
        const urlMaxDuration = searchParams.get('maxDuration') || '';
        const urlMaxPeople = searchParams.get('maxPeople') || '';
        const urlMinExperience = searchParams.get('minExperience') || '';
        const urlMinCapacity = searchParams.get('minCapacity') || '';

        // Only sync if URL is cleared (reset case)
        if (!urlSearch && localSearch) setLocalSearch('');
        if (!urlMinPrice && localMinPrice) setLocalMinPrice('');
        if (!urlMaxPrice && localMaxPrice) setLocalMaxPrice('');
        if (!urlMinDuration && localMinDuration) setLocalMinDuration('');
        if (!urlMaxDuration && localMaxDuration) setLocalMaxDuration('');
        if (!urlMaxPeople && localMaxPeople) setLocalMaxPeople('');
        if (!urlMinExperience && localMinExperience) setLocalMinExperience('');
        if (!urlMinCapacity && localMinCapacity) setLocalMinCapacity('');
    }, [searchParams]);

    // Generic debounce effect for updating URL params
    const useDebouncedFilter = (localValue: string, paramKey: string) => {
        useEffect(() => {
            const timer = setTimeout(() => {
                const currentUrlValue = searchParams.get(paramKey) || '';
                if (localValue !== currentUrlValue) {
                    const queryString = createQueryString({ [paramKey]: localValue || null });
                    router.push(`${pathname}?${queryString}`, { scroll: false });
                }
            }, DEBOUNCE_DELAY);
            return () => clearTimeout(timer);
        }, [localValue, paramKey]);
    };

    // Apply debounce to all text/number inputs
    useDebouncedFilter(localSearch, 'search');
    useDebouncedFilter(localMinPrice, 'minPrice');
    useDebouncedFilter(localMaxPrice, 'maxPrice');
    useDebouncedFilter(localMinDuration, 'minDuration');
    useDebouncedFilter(localMaxDuration, 'maxDuration');
    useDebouncedFilter(localMaxPeople, 'maxPeople');
    useDebouncedFilter(localMinExperience, 'minExperience');
    useDebouncedFilter(localMinCapacity, 'minCapacity');

    // Helper to update a specific filter
    const updateFilter = useCallback((key: string, value: string) => {
        const queryString = createQueryString({ [key]: value || null });
        router.push(`${pathname}?${queryString}`, { scroll: false });
    }, [createQueryString, router, pathname]);

    // Helper to clear all filters
    const clearAllFilters = useCallback(() => {
        router.push(pathname, { scroll: false });
    }, [router, pathname]);

    // Current values from URL
    const locationId = searchParams.get('locationId') || '';
    const sortBy = searchParams.get('sortBy') || '';
    const minRating = searchParams.get('minRating') || '';

    // Tour-specific
    const difficulty = searchParams.get('difficulty') || '';

    // Guide-specific
    const language = searchParams.get('language') || '';

    // Driver-specific
    const vehicleType = searchParams.get('vehicleType') || '';

    // Company-specific
    const hasActiveTours = searchParams.get('hasActiveTours') || '';

    // Check if any filters are active
    const hasActiveFilters = useMemo(() => {
        return locationId || sortBy || minRating || localMinPrice || localMaxPrice || localSearch ||
            difficulty || localMinDuration || localMaxDuration || localMaxPeople ||
            language || localMinExperience || vehicleType || localMinCapacity || hasActiveTours;
    }, [locationId, sortBy, minRating, localMinPrice, localMaxPrice, localSearch, difficulty,
        localMinDuration, localMaxDuration, localMaxPeople, language, localMinExperience, vehicleType,
        localMinCapacity, hasActiveTours]);

    // Get locations and filter by search query
    const locations = locationsData?.items || [];
    const filteredLocations = useMemo(() => {
        if (!locationSearchQuery.trim()) return locations;
        const query = locationSearchQuery.toLowerCase();
        return locations.filter(loc =>
            loc.name.toLowerCase().includes(query) ||
            (loc.region && loc.region.toLowerCase().includes(query))
        );
    }, [locations, locationSearchQuery]);

    // Get selected location name for display
    const selectedLocation = locations.find(loc => loc.id === locationId);
    const locationDisplayValue = selectedLocation
        ? `${selectedLocation.name}${selectedLocation.region ? ` (${selectedLocation.region})` : ''}`
        : t('explore_page.filters.location');

    const handleLocationSelect = (id: string) => {
        updateFilter('locationId', id);
        setLocationOpen(false);
        setLocationSearchQuery('');
    };

    // Sort options based on entity type
    const getSortOptions = () => {
        switch (type) {
            case 'tours':
                return [
                    { value: 'newest', label: t('explore_page.filters.sort_newest', 'Newest') },
                    { value: 'rating', label: t('explore_page.filters.sort_rating', 'Highest Rated') },
                    { value: 'price', label: t('explore_page.filters.sort_price_low', 'Price: Low to High') },
                    { value: 'price_desc', label: t('explore_page.filters.sort_price_high', 'Price: High to Low') },
                ];
            case 'guides':
                return [
                    { value: 'newest', label: t('explore_page.filters.sort_newest', 'Newest') },
                    { value: 'rating', label: t('explore_page.filters.sort_rating', 'Highest Rated') },
                    { value: 'experience', label: t('explore_page.filters.sort_experience', 'Most Experienced') },
                    { value: 'price', label: t('explore_page.filters.sort_price_low', 'Price: Low to High') },
                    { value: 'price_desc', label: t('explore_page.filters.sort_price_high', 'Price: High to Low') },
                ];
            case 'drivers':
                return [
                    { value: 'newest', label: t('explore_page.filters.sort_newest', 'Newest') },
                    { value: 'rating', label: t('explore_page.filters.sort_rating', 'Highest Rated') },
                    { value: 'capacity', label: t('explore_page.filters.sort_capacity', 'Largest Capacity') },
                ];
            case 'companies':
                return [
                    { value: 'newest', label: t('explore_page.filters.sort_newest', 'Newest') },
                    { value: 'rating', label: t('explore_page.filters.sort_rating', 'Highest Rated') },
                    { value: 'name', label: t('explore_page.filters.sort_name', 'Name A-Z') },
                ];
            default:
                return [
                    { value: 'newest', label: t('explore_page.filters.sort_newest', 'Newest') },
                    { value: 'rating', label: t('explore_page.filters.sort_rating', 'Highest Rated') },
                ];
        }
    };

    // Rating options
    const ratingOptions = [
        { value: '4', label: '4+ Stars' },
        { value: '3', label: '3+ Stars' },
        { value: '2', label: '2+ Stars' },
    ];

    // Difficulty options for tours
    const difficultyOptions = [
        { value: 'easy', label: t('explore_page.filters.difficulty_easy', 'Easy') },
        { value: 'moderate', label: t('explore_page.filters.difficulty_moderate', 'Moderate') },
        { value: 'challenging', label: t('explore_page.filters.difficulty_challenging', 'Challenging') },
    ];

    // Common language options
    const languageOptions = [
        { value: 'en', label: 'English' },
        { value: 'ka', label: 'Georgian' },
        { value: 'ru', label: 'Russian' },
        { value: 'de', label: 'German' },
        { value: 'fr', label: 'French' },
        { value: 'es', label: 'Spanish' },
        { value: 'it', label: 'Italian' },
        { value: 'zh', label: 'Chinese' },
        { value: 'ja', label: 'Japanese' },
        { value: 'ar', label: 'Arabic' },
    ];

    // Vehicle type options
    const vehicleTypeOptions = [
        { value: 'sedan', label: 'Sedan' },
        { value: 'suv', label: 'SUV' },
        { value: 'van', label: 'Van' },
        { value: 'minibus', label: 'Minibus' },
        { value: 'bus', label: 'Bus' },
    ];

    return (
        <div className={cn(
            "bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white rounded-md p-6 shadow-sm border border-gray-200 dark:border-gray-800 sticky top-28 w-full",
            className
        )}>
            {/* Header with Clear button */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    {t('explore_page.filters.title')}
                </h2>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            <div className="space-y-5">
                {/* Search Input - All types */}
                <FilterSection icon={Search} label={t('explore_page.filters.search', 'Search')}>
                    <Input
                        type="text"
                        placeholder={t('explore_page.filters.search_placeholder', 'Search...')}
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className={inputStyles}
                    />
                </FilterSection>

                {/* Location Select - All types */}
                <FilterSection icon={MapPin} label={t('explore_page.filters.location')}>
                    <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                disabled={isLoadingLocations}
                                className={cn(
                                    inputStyles,
                                    "flex items-center justify-between",
                                    !locationId && "text-gray-500 dark:text-muted-foreground"
                                )}
                            >
                                <span className="truncate">
                                    {isLoadingLocations ? 'Loading...' : locationDisplayValue}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-0 bg-white dark:bg-[#1f2937] border-gray-200 dark:border-white/10"
                            align="start"
                        >
                            <div className="p-2 border-b border-gray-200 dark:border-white/10">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder={t('explore_page.filters.search_placeholder', 'Search...')}
                                        value={locationSearchQuery}
                                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                                        className="pl-8 h-9 bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10"
                                    />
                                </div>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto p-1">
                                <button
                                    type="button"
                                    onClick={() => handleLocationSelect('all')}
                                    className={cn(
                                        "flex w-full items-center gap-2 px-2 py-1.5 rounded-sm text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-colors",
                                        !locationId && "bg-gray-100 dark:bg-white/5"
                                    )}
                                >
                                    <Check className={cn("h-4 w-4", !locationId ? "opacity-100" : "opacity-0")} />
                                    <span>All Locations</span>
                                </button>
                                {filteredLocations.map((location) => (
                                    <button
                                        key={location.id}
                                        type="button"
                                        onClick={() => handleLocationSelect(location.id)}
                                        className={cn(
                                            "flex w-full items-center gap-2 px-2 py-1.5 rounded-sm text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-colors",
                                            locationId === location.id && "bg-gray-100 dark:bg-white/5"
                                        )}
                                    >
                                        <Check className={cn("h-4 w-4", locationId === location.id ? "opacity-100" : "opacity-0")} />
                                        <span className="truncate">
                                            {location.name}
                                            {location.region && <span className="text-gray-500 dark:text-gray-400"> ({location.region})</span>}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </FilterSection>

                {/* Sort By - All types */}
                <FilterSection icon={SlidersHorizontal} label={t('explore_page.filters.sort_by', 'Sort By')}>
                    <Select value={sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                        <SelectTrigger className={inputStyles}>
                            <SelectValue placeholder={t('explore_page.filters.sort_default', 'Default')} />
                        </SelectTrigger>
                        <SelectContent>
                            {getSortOptions().map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FilterSection>

                {/* Rating Filter - All types */}
                <FilterSection icon={Star} label={t('explore_page.filters.min_rating', 'Minimum Rating')}>
                    <Select value={minRating} onValueChange={(value) => updateFilter('minRating', value)}>
                        <SelectTrigger className={inputStyles}>
                            <SelectValue placeholder={t('explore_page.filters.any_rating', 'Any Rating')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any Rating</SelectItem>
                            {ratingOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FilterSection>

                {/* Price Range - Tours, Guides */}
                {(type === 'tours' || type === 'guides') && (
                    <FilterSection icon={DollarSign} label={t('explore_page.filters.price_range', 'Price Range')}>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={localMinPrice}
                                onChange={(e) => setLocalMinPrice(e.target.value)}
                                className={cn(inputStyles, "w-1/2")}
                                min="0"
                            />
                            <Input
                                type="number"
                                placeholder="Max"
                                value={localMaxPrice}
                                onChange={(e) => setLocalMaxPrice(e.target.value)}
                                className={cn(inputStyles, "w-1/2")}
                                min="0"
                            />
                        </div>
                    </FilterSection>
                )}

                {/* Tour-specific filters */}
                {type === 'tours' && (
                    <>
                        {/* Difficulty */}
                        <FilterSection icon={SlidersHorizontal} label={t('explore_page.filters.difficulty', 'Difficulty')}>
                            <Select value={difficulty} onValueChange={(value) => updateFilter('difficulty', value)}>
                                <SelectTrigger className={inputStyles}>
                                    <SelectValue placeholder={t('explore_page.filters.any_difficulty', 'Any Difficulty')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Difficulty</SelectItem>
                                    {difficultyOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterSection>

                        {/* Duration Range */}
                        <FilterSection icon={Clock} label={t('explore_page.filters.duration', 'Duration (minutes)')}>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={localMinDuration}
                                    onChange={(e) => setLocalMinDuration(e.target.value)}
                                    className={cn(inputStyles, "w-1/2")}
                                    min="0"
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={localMaxDuration}
                                    onChange={(e) => setLocalMaxDuration(e.target.value)}
                                    className={cn(inputStyles, "w-1/2")}
                                    min="0"
                                />
                            </div>
                        </FilterSection>

                        {/* Group Size */}
                        <FilterSection icon={Users} label={t('explore_page.filters.group_size', 'Min Group Size')}>
                            <Input
                                type="number"
                                placeholder={t('explore_page.filters.min_people', 'Min people')}
                                value={localMaxPeople}
                                onChange={(e) => setLocalMaxPeople(e.target.value)}
                                className={inputStyles}
                                min="1"
                            />
                        </FilterSection>
                    </>
                )}

                {/* Guide-specific filters */}
                {type === 'guides' && (
                    <>
                        {/* Language */}
                        <FilterSection icon={Languages} label={t('explore_page.filters.language', 'Language')}>
                            <Select value={language} onValueChange={(value) => updateFilter('language', value)}>
                                <SelectTrigger className={inputStyles}>
                                    <SelectValue placeholder={t('explore_page.filters.any_language', 'Any Language')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Language</SelectItem>
                                    {languageOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterSection>

                        {/* Experience */}
                        <FilterSection icon={Star} label={t('explore_page.filters.experience', 'Min Experience (years)')}>
                            <Input
                                type="number"
                                placeholder={t('explore_page.filters.min_years', 'Min years')}
                                value={localMinExperience}
                                onChange={(e) => setLocalMinExperience(e.target.value)}
                                className={inputStyles}
                                min="0"
                            />
                        </FilterSection>
                    </>
                )}

                {/* Driver-specific filters */}
                {type === 'drivers' && (
                    <>
                        {/* Vehicle Type */}
                        <FilterSection icon={Car} label={t('explore_page.filters.vehicle_type', 'Vehicle Type')}>
                            <Select value={vehicleType} onValueChange={(value) => updateFilter('vehicleType', value)}>
                                <SelectTrigger className={inputStyles}>
                                    <SelectValue placeholder={t('explore_page.filters.any_vehicle', 'Any Vehicle')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Vehicle</SelectItem>
                                    {vehicleTypeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterSection>

                        {/* Min Capacity */}
                        <FilterSection icon={Users} label={t('explore_page.filters.min_capacity', 'Min Capacity')}>
                            <Input
                                type="number"
                                placeholder={t('explore_page.filters.min_seats', 'Min seats')}
                                value={localMinCapacity}
                                onChange={(e) => setLocalMinCapacity(e.target.value)}
                                className={inputStyles}
                                min="1"
                            />
                        </FilterSection>
                    </>
                )}

                {/* Company-specific filters */}
                {type === 'companies' && (
                    <>
                        {/* Has Active Tours */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hasActiveTours"
                                checked={hasActiveTours === 'true'}
                                onCheckedChange={(checked) =>
                                    updateFilter('hasActiveTours', checked ? 'true' : '')
                                }
                            />
                            <Label
                                htmlFor="hasActiveTours"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-2"
                            >
                                <Building2 className="h-4 w-4" />
                                {t('explore_page.filters.has_active_tours', 'Has Active Tours')}
                            </Label>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

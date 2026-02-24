'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMockTranslation } from '@/hooks/use-mock-translation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Compass, Landmark, Wine, Leaf, Umbrella, Calendar, Users, Search, X, Minus, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { colors } from '@/lib/colors';
import { LocationAutocomplete } from '@/components/common/LocationAutocomplete';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { LocationSearchResult } from '@/features/search/types/search.types';
import { cn } from '@/lib/utils';
import { useLocations } from '@/features/locations/hooks/useLocations';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface CategoryTab {
    key: string;
    translationKey: string;
    icon: LucideIcon;
    categorySlug: string | null;
    destinations: string[];
}

const HERO_CATEGORIES: CategoryTab[] = [
    {
        key: 'all',
        translationKey: 'home.hero.category_tabs.all',
        icon: Sparkles,
        categorySlug: null,
        destinations: ['Tbilisi', 'Batumi', 'Kazbegi (Stepantsminda)', 'Kutaisi', 'Mestia', 'Borjomi'],
    },
    {
        key: 'adventure',
        translationKey: 'home.hero.category_tabs.adventure',
        icon: Compass,
        categorySlug: 'Adventure',
        destinations: ['Kazbegi (Stepantsminda)', 'Tusheti (Omalo)', 'Gudauri', 'Shatili', 'Lagodekhi', 'Mestia'],
    },
    {
        key: 'cultural',
        translationKey: 'home.hero.category_tabs.cultural',
        icon: Landmark,
        categorySlug: 'Cultural',
        destinations: ['Tbilisi', 'Kutaisi', 'Gori', 'Vardzia', 'David Gareja', 'Uplistsikhe'],
    },
    {
        key: 'wine_food',
        translationKey: 'home.hero.category_tabs.wine_food',
        icon: Wine,
        categorySlug: 'Wine & Food',
        destinations: ['Telavi', 'Signagi', 'Kvareli', 'Tsinandali'],
    },
    {
        key: 'nature',
        translationKey: 'home.hero.category_tabs.nature',
        icon: Leaf,
        categorySlug: 'Nature',
        destinations: ['Borjomi', 'Martvili', 'Lagodekhi', 'Mestia', 'Ushguli'],
    },
    {
        key: 'beach',
        translationKey: 'home.hero.category_tabs.beach',
        icon: Umbrella,
        categorySlug: 'Beach & Coast',
        destinations: ['Batumi', 'Kobuleti'],
    },
];

export const HeroSection = (): JSX.Element => {
    const { t } = useMockTranslation();
    const router = useRouter();
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [mounted, setMounted] = useState(false);

    const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [guests, setGuests] = useState<number>(0);
    const [dateOpen, setDateOpen] = useState(false);
    const [guestsOpen, setGuestsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => { setMounted(true); }, []);

    // Fetch dynamic locations (limit 30 to resolve all category destination IDs)
    const { data: locationsData, isLoading: isLoadingLocations } = useLocations({
        isActive: true,
        limit: 30,
    });
    const locations = locationsData?.items || [];

    const findLocationByName = useCallback((name: string): { id: string; name: string } | undefined => {
        return locations?.find((loc) => loc.name === name);
    }, [locations]);

    const activeCategoryData = HERO_CATEGORIES.find((c) => c.key === activeCategory) ?? HERO_CATEGORIES[0];

    // Auto-focus flow: Location -> Date -> Guests
    const handleLocationSelect = useCallback(() => {
        setDateOpen(true);
    }, []);

    const handleDateSelect = useCallback((date: Date | undefined) => {
        setSelectedDate(date);
        setDateOpen(false);
        setTimeout(() => {
            setGuestsOpen(true);
        }, 150);
    }, []);

    const handleGuestsIncrement = useCallback(() => {
        setGuests((prev) => Math.min(prev + 1, 50));
    }, []);

    const handleGuestsDecrement = useCallback(() => {
        setGuests((prev) => Math.max(prev - 1, 0));
    }, []);

    const handleSearch = useCallback(() => {
        const params = new URLSearchParams();
        if (selectedLocation) {
            params.set('locationId', selectedLocation.id);
        }
        if (selectedDate) {
            params.set('dateFrom', selectedDate.toISOString().split('T')[0]);
        }
        if (guests > 0) {
            params.set('maxPeople', String(guests));
        }
        router.push(`/explore/tours?${params.toString()}`);
    }, [router, selectedLocation, selectedDate, guests]);

    const formatDate = (date: Date | undefined): string => {
        if (!date) return '';
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const getGuestsDisplayText = (): string => {
        if (guests === 0) return t('home.hero.search.guests_placeholder');
        if (guests === 1) return `1 ${t('home.hero.search.person')}`;
        return `${guests} ${t('home.hero.search.people_plural')}`;
    };

    // Shared date trigger content
    const dateTriggerContent = (isMobile: boolean): JSX.Element => (
        <>
            <Calendar className="text-muted-foreground w-5 h-5 shrink-0" />
            <span className={cn("flex flex-col text-left min-w-0 flex-1", isMobile ? "py-2" : "py-3")}>
                <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-0.5">
                    {t('home.hero.search.when')}
                </span>
                <span className={cn(
                    'text-sm truncate font-medium',
                    selectedDate ? 'text-foreground' : 'text-muted-foreground'
                )}>
                    {selectedDate ? formatDate(selectedDate) : t('home.hero.search.dates_placeholder')}
                </span>
            </span>
            {selectedDate && (
                <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setSelectedDate(undefined); }}
                    className="p-1 hover:bg-muted rounded-full transition-colors shrink-0"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </span>
            )}
        </>
    );

    // Shared guests trigger content
    const guestsTriggerContent = (isMobile: boolean): JSX.Element => (
        <>
            <Users className="text-muted-foreground w-5 h-5 shrink-0" />
            <span className={cn("flex flex-col text-left min-w-0 flex-1", isMobile ? "py-2" : "py-3")}>
                <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-0.5">
                    {t('home.hero.search.who')}
                </span>
                <span className={cn(
                    'text-sm truncate font-medium',
                    guests > 0 ? 'text-foreground' : 'text-muted-foreground'
                )}>
                    {getGuestsDisplayText()}
                </span>
            </span>
            {guests > 0 && (
                <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setGuests(0); }}
                    className="p-1 hover:bg-muted rounded-full transition-colors shrink-0"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </span>
            )}
        </>
    );

    // Shared calendar popover content
    const calendarContent = (
        <PopoverContent className="w-auto p-0" align="center" sideOffset={12}>
            <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                initialFocus
            />
        </PopoverContent>
    );

    // Shared guests popover content
    const guestsPopoverContent = (
        <PopoverContent className="w-64 p-4" align="center" sideOffset={12}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                    {t('home.hero.search.people', 'People')}
                </span>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleGuestsDecrement}
                        disabled={guests <= 0}
                        className={cn(
                            'h-9 w-9 rounded-lg border flex items-center justify-center transition-colors',
                            guests <= 0
                                ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                                : 'border-border text-foreground hover:bg-muted cursor-pointer'
                        )}
                    >
                        <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-base font-semibold tabular-nums w-6 text-center">
                        {guests}
                    </span>
                    <button
                        type="button"
                        onClick={handleGuestsIncrement}
                        disabled={guests >= 50}
                        className={cn(
                            'h-9 w-9 rounded-lg border flex items-center justify-center transition-colors',
                            guests >= 50
                                ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                                : 'border-border text-foreground hover:bg-muted cursor-pointer'
                        )}
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </PopoverContent>
    );

    // Determine if we should render popovers (only after mount, and only for the active layout)
    const renderDesktopPopovers = mounted && isDesktop;
    const renderMobilePopovers = mounted && !isDesktop;

    return (
        <section className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center px-2 min-[370px]:px-4 pt-40 pb-24">
            {/* Video Background */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a1a2e]">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src="/hero.mp4" type="video/mp4" />
                </video>
                {/* Dark overlay for readability */}
                <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="relative z-[2] flex flex-col items-center w-full">
                <h2 className="font-heading text-center text-xl min-[370px]:text-2xl min-[420px]:text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-semibold text-white mb-6 tracking-[1.15px] leading-loose pb-4 max-w-5xl mx-auto drop-shadow-md">
                    {t('home.hero.title_start')} <span className="text-gradient">{t('home.hero.title_end')}</span>
                </h2>
                <p className="text-center text-sm min-[370px]:text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-sm">
                    {t('home.hero.subtitle')}
                </p>

                {/* Search Bar - Cubic connected design */}
                <div className="w-full max-w-[900px]">
                    {/* Desktop layout */}
                    <div className="hidden md:flex bg-background border-[3px] shadow-lg rounded-lg items-stretch" style={{ borderColor: colors.secondary }}>
                        {/* Where - Location */}
                        <LocationAutocomplete
                            value={selectedLocation}
                            onChange={setSelectedLocation}
                            onSelect={handleLocationSelect}
                            className="flex-[1.2] min-w-0"
                            triggerClassName="h-full flex items-center px-5 rounded-l-md rounded-r-none hover:bg-muted/50 transition-colors"
                        />

                        {/* Vertical Divider */}
                        <div className="w-[3px] shrink-0" style={{ backgroundColor: colors.secondary }} />

                        {/* When - Date Picker */}
                        {renderDesktopPopovers ? (
                            <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                <PopoverTrigger className={cn(
                                    'flex-1 flex items-center gap-3 px-5 cursor-pointer transition-colors min-w-0 border-none bg-transparent',
                                    dateOpen ? 'bg-muted/50' : 'hover:bg-muted/50'
                                )}>
                                    {dateTriggerContent(false)}
                                </PopoverTrigger>
                                {calendarContent}
                            </Popover>
                        ) : (
                            <div className="flex-1 flex items-center gap-3 px-5 cursor-pointer transition-colors min-w-0 hover:bg-muted/50">
                                {dateTriggerContent(false)}
                            </div>
                        )}

                        {/* Vertical Divider */}
                        <div className="w-[3px] shrink-0" style={{ backgroundColor: colors.secondary }} />

                        {/* Who - People Selector Popover */}
                        {renderDesktopPopovers ? (
                            <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
                                <PopoverTrigger className={cn(
                                    'flex-1 flex items-center gap-3 px-5 cursor-pointer transition-colors min-w-0 border-none bg-transparent',
                                    guestsOpen ? 'bg-muted/50' : 'hover:bg-muted/50'
                                )}>
                                    {guestsTriggerContent(false)}
                                </PopoverTrigger>
                                {guestsPopoverContent}
                            </Popover>
                        ) : (
                            <div className="flex-1 flex items-center gap-3 px-5 cursor-pointer transition-colors min-w-0 hover:bg-muted/50">
                                {guestsTriggerContent(false)}
                            </div>
                        )}

                        {/* Search Button - connected to right edge */}
                        <button
                            onClick={handleSearch}
                            style={{ backgroundColor: colors.secondary }}
                            className="hover:opacity-90 text-primary-foreground rounded-r px-7 flex items-center justify-center gap-2 font-medium transition-all cursor-pointer shrink-0"
                        >
                            <Search className="w-5 h-5" />
                            <span>{t('home.hero.search.search_button')}</span>
                        </button>
                    </div>

                    {/* Mobile layout - stacked connected card */}
                    <div className="flex md:hidden flex-col bg-background border-[3px] shadow-lg rounded-lg" style={{ borderColor: colors.secondary }}>
                        {/* Where */}
                        <LocationAutocomplete
                            value={selectedLocation}
                            onChange={setSelectedLocation}
                            onSelect={handleLocationSelect}
                            className="min-h-[64px]"
                            triggerClassName="h-full flex items-center px-4 rounded-t-md rounded-b-none hover:bg-muted/50 transition-colors"
                        />

                        {/* Horizontal Divider */}
                        <div className="h-[3px]" style={{ backgroundColor: colors.secondary }} />

                        {/* When */}
                        {renderMobilePopovers ? (
                            <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                <PopoverTrigger className={cn(
                                    'w-full flex items-center gap-3 px-4 cursor-pointer transition-colors min-h-[64px] border-none bg-transparent',
                                    dateOpen ? 'bg-muted/50' : 'hover:bg-muted/50'
                                )}>
                                    {dateTriggerContent(true)}
                                </PopoverTrigger>
                                {calendarContent}
                            </Popover>
                        ) : (
                            <div className="flex items-center gap-3 px-4 cursor-pointer transition-colors min-h-[64px] hover:bg-muted/50">
                                {dateTriggerContent(true)}
                            </div>
                        )}

                        {/* Horizontal Divider */}
                        <div className="h-[3px]" style={{ backgroundColor: colors.secondary }} />

                        {/* Who - People */}
                        {renderMobilePopovers ? (
                            <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
                                <PopoverTrigger className={cn(
                                    'w-full flex items-center gap-3 px-4 cursor-pointer transition-colors min-h-[64px] border-none bg-transparent',
                                    guestsOpen ? 'bg-muted/50' : 'hover:bg-muted/50'
                                )}>
                                    {guestsTriggerContent(true)}
                                </PopoverTrigger>
                                {guestsPopoverContent}
                            </Popover>
                        ) : (
                            <div className="flex items-center gap-3 px-4 cursor-pointer transition-colors min-h-[64px] hover:bg-muted/50">
                                {guestsTriggerContent(true)}
                            </div>
                        )}

                        {/* Search Button - full width at bottom */}
                        <div className="p-3 pt-1">
                            <button
                                onClick={handleSearch}
                                style={{ backgroundColor: colors.secondary }}
                                className="hover:opacity-90 text-primary-foreground rounded-lg px-5 h-[52px] flex items-center justify-center gap-2 font-medium shadow-md transition-all cursor-pointer w-full"
                            >
                                <Search className="w-5 h-5" />
                                <span>{t('home.hero.search.search_button')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Tabs + Sub-Tags */}
                <div className="mt-4 w-full max-w-[900px] flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-backwards">
                    {/* Category Tabs Row — compact segmented control */}
                    <div className="w-full flex rounded-md overflow-hidden bg-background shadow-sm">
                        {HERO_CATEGORIES.map((category) => {
                            const Icon = category.icon;
                            const isActive = activeCategory === category.key;
                            return (
                                <button
                                    key={category.key}
                                    onClick={() => setActiveCategory(category.key)}
                                    className={cn(
                                        "flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                                        isActive
                                            ? "text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                    style={isActive ? { backgroundColor: colors.secondary } : undefined}
                                >
                                    <Icon className="h-3 w-3" />
                                    <span className="hidden min-[480px]:inline">{t(category.translationKey)}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Sub-Tags Row */}
                    <div className="flex flex-wrap items-center justify-center gap-2.5 min-h-[36px]">
                        {isLoadingLocations ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-8 w-20 rounded-full bg-muted/50 animate-pulse" />
                            ))
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeCategory}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-wrap items-center justify-center gap-2.5"
                                >
                                    {activeCategoryData.destinations.map((destName) => {
                                        const location = findLocationByName(destName);
                                        return (
                                            <button
                                                key={destName}
                                                onClick={() => {
                                                    const params = new URLSearchParams();
                                                    if (activeCategoryData.categorySlug) {
                                                        params.set('category', activeCategoryData.categorySlug);
                                                    }
                                                    if (location) {
                                                        params.set('locationId', location.id);
                                                    }
                                                    router.push(`/explore/tours?${params.toString()}`);
                                                }}
                                                className="text-sm font-medium text-muted-foreground bg-background hover:bg-muted hover:text-foreground rounded-full px-3.5 py-1.5 transition-all duration-150 cursor-pointer shadow-sm border border-border/50"
                                            >
                                                # {destName}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

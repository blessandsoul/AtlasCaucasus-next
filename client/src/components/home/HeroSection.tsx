'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMockTranslation } from '@/hooks/use-mock-translation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Plane, TrendingUp, Sun, Mountain, Building2, Calendar, Users, Search, X, MapPin } from 'lucide-react';
import { colors } from '@/lib/colors';
import { LocationAutocomplete } from '@/components/common/LocationAutocomplete';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { LocationSearchResult } from '@/features/search/types/search.types';
import { cn } from '@/lib/utils';
import { useLocations } from '@/features/locations/hooks/useLocations';

// Helper to determine icon based on name
const getLocationIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('turkey') || lowerName.includes('sun')) return Sun;
    if (lowerName.includes('armenia') || lowerName.includes('mountain')) return Mountain;
    if (lowerName.includes('azerbaijan') || lowerName.includes('city')) return Building2;
    if (lowerName.includes('greece') || lowerName.includes('island')) return Plane;
    if (lowerName.includes('georgia')) return TrendingUp;
    return MapPin; // Default
};

const getLocationIconColor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('turkey')) return "text-orange-400";
    if (lowerName.includes('armenia')) return "text-yellow-600";
    if (lowerName.includes('azerbaijan')) return "text-blue-500";
    if (lowerName.includes('greece')) return "text-sky-500";
    if (lowerName.includes('georgia')) return "text-emerald-600";
    return "text-muted-foreground";
};

export const HeroSection = () => {
    const { t } = useMockTranslation();
    const router = useRouter();
    const { scrollY } = useScroll();
    const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);

    const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [guests, setGuests] = useState<string>('');
    const [dateOpen, setDateOpen] = useState(false);
    const [guestsFocused, setGuestsFocused] = useState(false);

    const guestsInputRef = useRef<HTMLInputElement>(null);

    // Fetch dynamic locations
    const { data: locationsData, isLoading: isLoadingLocations } = useLocations({
        isActive: true,
        limit: 5 // Limit to 5 for the hero section chips
    });
    const locations = locationsData?.items || [];

    // Auto-focus flow: Location -> Date -> Guests
    const handleLocationSelect = useCallback(() => {
        setDateOpen(true);
    }, []);

    const handleDateSelect = useCallback((date: Date | undefined) => {
        setSelectedDate(date);
        setDateOpen(false);
        // Focus guests input after date selection
        setTimeout(() => {
            guestsInputRef.current?.focus();
        }, 100);
    }, []);

    const handleSearch = useCallback(() => {
        const params = new URLSearchParams();
        if (selectedLocation) {
            params.set('locationId', selectedLocation.id);
        }
        if (selectedDate) {
            params.set('date', selectedDate.toISOString().split('T')[0]);
        }
        if (guests) {
            params.set('guests', guests);
        }
        router.push(`/explore/tours?${params.toString()}`);
    }, [router, selectedLocation, selectedDate, guests]);

    const formatDate = (date: Date | undefined) => {
        if (!date) return '';
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <section className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center px-2 min-[370px]:px-4 pt-40 pb-24 overflow-hidden">
            {/* Background Image with Parallax */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    style={{ y: backgroundY, scale: 1.1 }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Using simple img for parity, next/image generally preferred but needs width/height or fill */}
                    <img
                        src="/hero-backgrounds/hero-main.png"
                        alt="Hero Background"
                        className="h-full w-full object-cover"
                        style={{ objectPosition: 'center 30%' }}
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </motion.div>
            </div>

            {/* Bottom Gradient Transition */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/60 to-transparent z-0 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center w-full">
                <h2 className="font-heading text-center text-xl min-[370px]:text-2xl min-[420px]:text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-semibold text-white mb-6 tracking-[1.15px] leading-relaxed pb-4 max-w-5xl mx-auto drop-shadow-md">
                    {t('home.hero.title_start')} <span className="text-gradient">{t('home.hero.title_end')}</span>
                </h2>
                <p className="text-center text-sm min-[370px]:text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-sm">
                    {t('home.hero.subtitle')}
                </p>

                <div className="w-full max-w-[896px] bg-background border shadow-lg flex flex-col md:flex-row items-stretch md:items-center rounded-3xl md:rounded-full p-2 md:p-0 md:pr-2">
                    {/* Where - Location Autocomplete */}
                    <LocationAutocomplete
                        value={selectedLocation}
                        onChange={setSelectedLocation}
                        onSelect={handleLocationSelect}
                        className="flex-1 min-h-[72px] md:min-h-0"
                        triggerClassName="h-full flex items-center px-4 md:px-6 rounded-2xl md:rounded-l-full md:rounded-r-none hover:bg-muted/50 transition-colors"
                    />

                    {/* Divider */}
                    <div className="hidden md:block w-px h-10 bg-border shrink-0" />
                    <div className="block md:hidden w-full h-px bg-border shrink-0 my-1" />

                    {/* When - Date Picker */}
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                            <div className={cn(
                                'flex-1 flex items-center gap-3 px-4 md:px-3 lg:px-6 cursor-pointer transition-colors min-h-[72px] md:min-h-0 rounded-2xl md:rounded-none',
                                dateOpen ? 'bg-muted/50' : 'hover:bg-muted/50'
                            )}>
                                <Calendar className="text-muted-foreground w-5 h-5 shrink-0" />
                                <div className="flex flex-col text-left min-w-0 flex-1 py-2">
                                    <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-0.5">
                                        {t('home.hero.search.when')}
                                    </span>
                                    <span className={cn(
                                        'text-sm truncate font-medium',
                                        selectedDate ? 'text-foreground' : 'text-muted-foreground'
                                    )}>
                                        {selectedDate ? formatDate(selectedDate) : t('home.hero.search.dates_placeholder')}
                                    </span>
                                </div>
                                {selectedDate && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setSelectedDate(undefined); }}
                                        className="p-1 hover:bg-muted rounded-full transition-colors"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                )}
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center" sideOffset={8}>
                            <CalendarComponent
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-10 bg-border shrink-0" />
                    <div className="block md:hidden w-full h-px bg-border shrink-0 my-1" />

                    {/* Who - Guest Count (Inline Input) */}
                    <div
                        className={cn(
                            'flex-1 flex items-center gap-3 px-4 md:px-3 lg:px-6 transition-colors min-h-[72px] md:min-h-0 rounded-2xl md:rounded-none',
                            guestsFocused ? 'bg-muted/50' : 'hover:bg-muted/50'
                        )}
                        onClick={() => guestsInputRef.current?.focus()}
                    >
                        <Users className="text-muted-foreground w-5 h-5 shrink-0" />
                        <div className="flex flex-col text-left min-w-0 flex-1 py-2">
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-0.5">
                                {t('home.hero.search.who')}
                            </span>
                            <input
                                ref={guestsInputRef}
                                type="number"
                                min="1"
                                max="50"
                                value={guests}
                                onChange={(e) => setGuests(e.target.value)}
                                onFocus={() => setGuestsFocused(true)}
                                onBlur={() => setGuestsFocused(false)}
                                placeholder={t('home.hero.search.guests_placeholder')}
                                className="text-sm font-medium bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                            />
                        </div>
                        {guests && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setGuests(''); }}
                                className="p-1 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        style={{ backgroundColor: colors.secondary }}
                        className="hover:opacity-90 text-primary-foreground rounded-2xl md:rounded-full px-5 lg:px-8 h-[64px] md:h-14 flex items-center justify-center gap-2 font-medium shadow-md transition-all mt-2 md:mt-0 md:ml-0.5 cursor-pointer shrink-0 w-full md:w-auto"
                    >
                        <Search className="w-5 h-5" />
                        <span className="md:hidden">Search</span>
                        <span className="hidden md:inline">{t('home.hero.search.search_button')}</span>
                    </button>
                </div>

                {/* Booked Today Stat */}
                <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-4 py-1.5 text-sm font-medium shadow-sm border border-border/50">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <div className="p-0.5 rounded bg-blue-100/50">
                            <Plane className="h-3 w-3 text-blue-500" />
                        </div>
                        {t('home.hero.booked_today')}
                    </span>
                </div>

                {/* Trending Section */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-backwards min-h-[40px]">
                    {isLoadingLocations ? (
                        // Simple Skeleton Loading
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-9 w-24 rounded-full bg-muted/50 animate-pulse" />
                        ))
                    ) : (
                        <>
                            {/* Static 'All' or 'Georgia' can be kept if needed, but user asked for dynamic resources. 
                                We can add a "All Destinations" or similar if we want, but let's stick to the fetched list functionality first.
                                Or we can hardcode Georgia if it's special, but safer to rely on DB. 
                            */}

                            {locations?.map((location) => {
                                const Icon = getLocationIcon(location.name);
                                const isSelected = selectedLocation?.id === location.id;

                                return (
                                    <button
                                        key={location.id}
                                        onClick={() => {
                                            const params = new URLSearchParams();
                                            params.set('locationId', location.id);
                                            router.push(`/explore/tours?${params.toString()}`);
                                        }}
                                        className={cn(
                                            "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium shadow-sm border transition-all cursor-pointer",
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background text-muted-foreground border-border/50 hover:shadow-md hover:text-foreground"
                                        )}
                                    >
                                        <Icon className={cn(
                                            "h-3.5 w-3.5",
                                            isSelected ? "text-primary-foreground" : getLocationIconColor(location.name)
                                        )} />
                                        {location.name}
                                    </button>
                                );
                            })}

                            {(!locations || locations.length === 0) && (
                                <span className="text-sm text-muted-foreground">
                                    {t('home.hero.no_destinations', 'No featured destinations available')}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

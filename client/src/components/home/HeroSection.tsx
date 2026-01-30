'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMockTranslation } from '@/hooks/use-mock-translation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Plane, TrendingUp, Sun, Mountain, Building2, Calendar, Users, Search, X } from 'lucide-react';
import { colors } from '@/lib/colors';
import { LocationAutocomplete } from '@/components/common/LocationAutocomplete';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { LocationSearchResult } from '@/features/search/types/search.types';
import { cn } from '@/lib/utils';

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
        <section className="relative flex min-h-[50vh] w-full flex-col items-center justify-center px-4 pt-40 pb-24 overflow-hidden">
            {/* Background Image with Parallax */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    style={{ y: backgroundY, scale: 1.1 }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Using simple img for parity, next/image generally preferred but needs width/height or fill */}
                    <img
                        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80"
                        alt="Hero Background"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </motion.div>
            </div>

            <div className="relative z-10 flex flex-col items-center w-full">
                <h2 className="font-heading text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white mb-6 tracking-[1.15px] leading-tight pb-2 max-w-5xl mx-auto drop-shadow-md">
                    {t('home.hero.title_start')} <span className="text-gradient">{t('home.hero.title_end')}</span>
                </h2>
                <p className="text-center text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-sm">
                    {t('home.hero.subtitle')}
                </p>

                <div className="w-full max-w-[896px] rounded-full bg-background border shadow-lg flex items-center pr-2">
                    {/* Where - Location Autocomplete */}
                    <LocationAutocomplete
                        value={selectedLocation}
                        onChange={setSelectedLocation}
                        onSelect={handleLocationSelect}
                    />

                    {/* Divider */}
                    <div className="w-px h-10 bg-border shrink-0" />

                    {/* When - Date Picker */}
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                            <div className={cn(
                                'flex-1 flex items-center gap-3 px-6 cursor-pointer transition-colors h-full py-3',
                                dateOpen ? 'bg-muted/50' : 'hover:bg-muted/50'
                            )}>
                                <Calendar className="text-muted-foreground w-5 h-5 shrink-0" />
                                <div className="flex flex-col text-left min-w-0 flex-1">
                                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                                        {t('home.hero.search.when')}
                                    </span>
                                    <span className={cn(
                                        'text-sm truncate',
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
                    <div className="w-px h-10 bg-border shrink-0" />

                    {/* Who - Guest Count (Inline Input) */}
                    <div
                        className={cn(
                            'flex-1 flex items-center gap-3 px-6 transition-colors h-full py-3',
                            guestsFocused ? 'bg-muted/50' : 'hover:bg-muted/50'
                        )}
                        onClick={() => guestsInputRef.current?.focus()}
                    >
                        <Users className="text-muted-foreground w-5 h-5 shrink-0" />
                        <div className="flex flex-col text-left min-w-0 flex-1">
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
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
                                className="text-sm bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                        className="hover:opacity-90 text-primary-foreground rounded-full px-8 py-3.5 flex items-center gap-2 font-medium shadow-md transition-all ml-2 cursor-pointer my-2 shrink-0"
                    >
                        <Search className="w-5 h-5" />
                        {t('home.hero.search.search_button')}
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
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-backwards">
                    <button className="inline-flex items-center gap-2 rounded-full bg-background px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-sm border border-border/50 hover:shadow-md hover:text-foreground transition-all cursor-pointer">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        {t('home.hero.countries.georgia')}
                        <TrendingUp className="h-3 w-3 ml-0.5 text-emerald-600" />
                    </button>

                    <button className="inline-flex items-center gap-2 rounded-full bg-background px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-sm border border-border/50 hover:shadow-md hover:text-foreground transition-all cursor-pointer">
                        <Sun className="h-3.5 w-3.5 text-orange-400" />
                        {t('home.hero.countries.turkey')}
                    </button>

                    <button className="inline-flex items-center gap-2 rounded-full bg-background px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-sm border border-border/50 hover:shadow-md hover:text-foreground transition-all cursor-pointer">
                        <Mountain className="h-3.5 w-3.5 text-yellow-600" />
                        {t('home.hero.countries.armenia')}
                    </button>

                    <button className="inline-flex items-center gap-2 rounded-full bg-background px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-sm border border-border/50 hover:shadow-md hover:text-foreground transition-all cursor-pointer">
                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                        {t('home.hero.countries.azerbaijan')}
                    </button>

                    <button className="inline-flex items-center gap-2 rounded-full bg-background px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-sm border border-border/50 hover:shadow-md hover:text-foreground transition-all cursor-pointer">
                        <Plane className="h-3.5 w-3.5 text-sky-500" />
                        {t('home.hero.countries.greece')}
                    </button>
                </div>
            </div>
        </section>
    );
};

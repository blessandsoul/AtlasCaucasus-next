import { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { useMockTranslation } from '@/hooks/use-mock-translation';
import { useSearchLocations } from '@/features/search/hooks/useSearch';
import { useLocations } from '@/features/locations/hooks/useLocations';
import type { LocationSearchResult } from '@/features/search/types/search.types';
import { cn } from '@/lib/utils';

interface LocationAutocompleteProps {
    value?: LocationSearchResult | null;
    onChange: (location: LocationSearchResult | null) => void;
    onSelect?: () => void;
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
}

export const LocationAutocomplete = ({
    value,
    onChange,
    onSelect,
    placeholder,
    className,
    triggerClassName,
}: LocationAutocompleteProps): JSX.Element => {
    const { t } = useMockTranslation();
    const [isFocused, setIsFocused] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data: searchResults, isLoading: isSearching } = useSearchLocations(query, 8);

    // Fetch trending/popular locations to show when dropdown opens with no query
    const { data: trendingData, isLoading: isTrendingLoading } = useLocations({
        isActive: true,
        limit: 5,
    });
    const trendingLocations = trendingData?.items || [];

    const handleSelect = useCallback(
        (location: LocationSearchResult) => {
            onChange(location);
            setQuery('');
            setIsFocused(false);
            onSelect?.();
        },
        [onChange, onSelect]
    );

    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setQuery('');
        inputRef.current?.focus();
    }, [onChange]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        if (value) {
            onChange(null);
        }
    }, [value, onChange]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent): void => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayValue = value ? `${value.name}${value.region ? `, ${value.region}` : ''}` : query;

    // Show dropdown when focused: either search results or trending destinations
    const hasSearchQuery = query.length > 0;
    const showDropdown = isFocused;

    return (
        <div ref={containerRef} className={cn('relative flex-1', className)}>
            <div
                className={cn(
                    'flex items-center gap-3 px-6 h-full py-3 transition-colors',
                    !triggerClassName && 'rounded-l-2xl',
                    triggerClassName,
                    isFocused ? 'bg-muted/50' : 'hover:bg-muted/50'
                )}
                onClick={() => inputRef.current?.focus()}
            >
                <MapPin className="text-muted-foreground w-5 h-5 shrink-0" />
                <div className="flex flex-col text-left min-w-0 flex-1">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        {t('home.hero.search.where')}
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={displayValue}
                        onChange={handleInputChange}
                        onFocus={() => setIsFocused(true)}
                        placeholder={placeholder || t('home.hero.search.destinations_placeholder')}
                        className="text-sm bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground"
                    />
                </div>
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-1 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden min-w-[280px] max-w-[calc(100vw-2rem)]">
                    {/* Searching state */}
                    {hasSearchQuery && isSearching && (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {/* Search results */}
                    {hasSearchQuery && !isSearching && searchResults && searchResults.length === 0 && (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            {t('common.no_results', 'No results found')}
                        </div>
                    )}
                    {hasSearchQuery && !isSearching && searchResults && searchResults.length > 0 && (
                        <ul className="py-1 max-h-60 overflow-y-auto">
                            {searchResults.map((location) => (
                                <li
                                    key={location.id}
                                    className="px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleSelect(location)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-muted rounded-lg shrink-0">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold">{location.name}</p>
                                            {location.region && (
                                                <p className="text-xs text-muted-foreground">
                                                    {location.region}, {location.country}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Trending destinations (shown when no search query) */}
                    {!hasSearchQuery && (
                        <>
                            <div className="px-4 pt-3 pb-1">
                                <p className="text-sm font-semibold text-foreground">
                                    {t('home.hero.search.trending_destinations', 'Trending destinations')}
                                </p>
                            </div>
                            {isTrendingLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : trendingLocations.length > 0 ? (
                                <ul className="py-1 max-h-60 overflow-y-auto">
                                    {trendingLocations.map((location) => (
                                        <li
                                            key={location.id}
                                            className="px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => handleSelect({
                                                id: location.id,
                                                name: location.name,
                                                region: location.region || null,
                                                country: location.country,
                                            })}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded-lg shrink-0">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold">{location.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {location.country}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                    {t('home.hero.no_destinations', 'No featured destinations available')}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

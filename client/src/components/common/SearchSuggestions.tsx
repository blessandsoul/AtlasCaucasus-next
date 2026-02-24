'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MapIcon, Building2, Users, Car, Star, ArrowRight, Loader2 } from 'lucide-react';

import { useSearch } from '@/features/search/hooks/useSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { ROUTES } from '@/lib/constants/routes';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import type { TourSearchResult, CompanySearchResult, GuideSearchResult, DriverSearchResult } from '@/features/search/types/search.types';

interface SearchSuggestionsProps {
    query: string;
    isOpen: boolean;
    onSelect: () => void;
    className?: string;
}

const RatingBadge = ({ rating }: { rating: number | null }) => {
    if (!rating) return null;
    return (
        <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
        </span>
    );
};

export const SearchSuggestions = ({ query, isOpen, onSelect, className }: SearchSuggestionsProps) => {
    const { t } = useTranslation();
    const debouncedQuery = useDebounce(query.trim(), 300);

    const { data, isLoading } = useSearch(
        { query: debouncedQuery, limit: 3 },
        isOpen && debouncedQuery.length >= 2
    );

    const hasTours = !!data?.tours?.length;
    const hasCompanies = !!data?.companies?.length;
    const hasGuides = !!data?.guides?.length;
    const hasDrivers = !!data?.drivers?.length;
    const hasResults = hasTours || hasCompanies || hasGuides || hasDrivers;
    const showDropdown = isOpen && debouncedQuery.length >= 2;

    if (!showDropdown) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className={cn(
                    'absolute top-full left-0 right-0 mt-1.5 bg-background rounded-xl border shadow-lg z-50 overflow-hidden',
                    className
                )}
            >
                <div className="max-h-[360px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">{t('common.loading', 'Searching...')}</span>
                        </div>
                    ) : !hasResults ? (
                        <div className="py-8 text-center">
                            <p className="text-sm text-muted-foreground">
                                {t('search.no_results', 'No results found')}
                            </p>
                        </div>
                    ) : (
                        <div className="py-1.5">
                            {/* Tours */}
                            {hasTours && (
                                <SuggestionSection
                                    icon={<MapIcon className="h-3.5 w-3.5" />}
                                    title={t('search.categories.tours', 'Tours')}
                                    count={data.counts.tours}
                                >
                                    {data.tours.map((tour) => (
                                        <TourItem key={tour.id} tour={tour} onSelect={onSelect} />
                                    ))}
                                </SuggestionSection>
                            )}

                            {/* Companies */}
                            {hasCompanies && (
                                <SuggestionSection
                                    icon={<Building2 className="h-3.5 w-3.5" />}
                                    title={t('search.categories.companies', 'Companies')}
                                    count={data.counts.companies}
                                >
                                    {data.companies.map((company) => (
                                        <CompanyItem key={company.id} company={company} onSelect={onSelect} />
                                    ))}
                                </SuggestionSection>
                            )}

                            {/* Guides */}
                            {hasGuides && (
                                <SuggestionSection
                                    icon={<Users className="h-3.5 w-3.5" />}
                                    title={t('search.categories.guides', 'Guides')}
                                    count={data.counts.guides}
                                >
                                    {data.guides.map((guide) => (
                                        <GuideItem key={guide.id} guide={guide} onSelect={onSelect} />
                                    ))}
                                </SuggestionSection>
                            )}

                            {/* Drivers */}
                            {hasDrivers && (
                                <SuggestionSection
                                    icon={<Car className="h-3.5 w-3.5" />}
                                    title={t('search.categories.drivers', 'Drivers')}
                                    count={data.counts.drivers}
                                >
                                    {data.drivers.map((driver) => (
                                        <DriverItem key={driver.id} driver={driver} onSelect={onSelect} />
                                    ))}
                                </SuggestionSection>
                            )}
                        </div>
                    )}

                    {/* View all results footer */}
                    {hasResults && (
                        <div className="border-t px-3 py-2">
                            <Link
                                href={`${ROUTES.EXPLORE.TOURS}?search=${encodeURIComponent(debouncedQuery)}`}
                                onClick={onSelect}
                                className="flex items-center justify-between px-2 py-1.5 text-sm font-medium text-primary hover:underline rounded-lg transition-colors"
                            >
                                <span>{t('search.view_all', 'View all results')}</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

/* --- Section wrapper --- */

const SuggestionSection = ({
    icon,
    title,
    count,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    count: number;
    children: React.ReactNode;
}) => (
    <div className="px-2 py-1">
        <div className="flex items-center gap-1.5 px-2 py-1">
            <span className="text-muted-foreground">{icon}</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {title}
            </span>
            <span className="text-[11px] text-muted-foreground">({count})</span>
        </div>
        {children}
    </div>
);

/* --- Result items --- */

const TourItem = ({ tour, onSelect }: { tour: TourSearchResult; onSelect: () => void }) => (
    <Link
        href={ROUTES.TOURS.DETAILS(tour.id)}
        onClick={onSelect}
        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
    >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <MapIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{tour.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatCurrency(tour.price, tour.currency)}</span>
                {tour.locations?.[0] && (
                    <>
                        <span className="text-border">·</span>
                        <span className="truncate">{tour.locations[0].name}</span>
                    </>
                )}
            </div>
        </div>
        <RatingBadge rating={tour.averageRating} />
    </Link>
);

const CompanyItem = ({ company, onSelect }: { company: CompanySearchResult; onSelect: () => void }) => (
    <Link
        href={`${ROUTES.EXPLORE.COMPANIES}/${company.id}`}
        onClick={onSelect}
        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
    >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Building2 className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">{company.companyName}</p>
                {company.isVerified && (
                    <span className="shrink-0 inline-flex items-center rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                        Verified
                    </span>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                {company.tourCount} {company.tourCount === 1 ? 'tour' : 'tours'}
            </p>
        </div>
        <RatingBadge rating={company.averageRating} />
    </Link>
);

const GuideItem = ({ guide, onSelect }: { guide: GuideSearchResult; onSelect: () => void }) => (
    <Link
        href={`${ROUTES.EXPLORE.GUIDES}/${guide.id}`}
        onClick={onSelect}
        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
    >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Users className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
                {guide.user.firstName} {guide.user.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
                {guide.languages?.slice(0, 2).join(', ')}
            </p>
        </div>
        <RatingBadge rating={guide.averageRating} />
    </Link>
);

const DriverItem = ({ driver, onSelect }: { driver: DriverSearchResult; onSelect: () => void }) => (
    <Link
        href={`${ROUTES.EXPLORE.DRIVERS}/${driver.id}`}
        onClick={onSelect}
        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
    >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Car className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
                {driver.user.firstName} {driver.user.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
                {[driver.vehicleMake, driver.vehicleModel].filter(Boolean).join(' ') || driver.vehicleType}
            </p>
        </div>
        <RatingBadge rating={driver.averageRating} />
    </Link>
);

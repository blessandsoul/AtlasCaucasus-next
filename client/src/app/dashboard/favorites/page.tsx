'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueries } from '@tanstack/react-query';
import Link from 'next/link';
import {
    Heart, MapPin, Clock, Star, Car, Globe,
    Building2, Compass, HeartOff, Sparkles, Shield,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

import { useFavorites, useToggleFavorite } from '@/features/favorites/hooks/useFavorites';
import { tourService } from '@/features/tours/services/tour.service';
import { guideService } from '@/features/guides/services/guide.service';
import { driverService } from '@/features/drivers/services/driver.service';
import { companyService } from '@/features/companies/services/company.service';
import { cn } from '@/lib/utils';

import type { FavoriteEntityType, Favorite } from '@/features/favorites/types/favorite.types';
import type { Tour } from '@/features/tours/types/tour.types';
import type { Guide } from '@/features/guides/types/guide.types';
import type { Driver } from '@/features/drivers/types/driver.types';
import type { Company } from '@/features/companies/types/company.types';

type TabValue = 'ALL' | FavoriteEntityType;

/* ── Module-level fetchers ─────────────────────────────── */

const fetchTour = (id: string): Promise<Tour> => tourService.getTour(id);
const fetchGuide = (id: string): Promise<Guide> => guideService.getGuide(id);
const fetchDriver = (id: string): Promise<Driver> => driverService.getDriver(id);
const fetchCompany = (id: string): Promise<Company> => companyService.getCompany(id);

/* ── Helpers ───────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

function fmtPrice(price: string | number, cur = 'GEL'): string {
    const sym: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€' };
    return `${sym[cur] ?? cur} ${Number(price)}`;
}

function fmtDuration(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

/* ── Shared small components ───────────────────────────── */

function RatingBadge({ rating, count }: { rating?: number | string | null; count?: number }): React.ReactNode {
    const num = rating != null ? Number(rating) : 0;
    if (!num) return <span className="text-muted-foreground text-sm">-</span>;
    return (
        <span className="inline-flex items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="font-medium tabular-nums">{num.toFixed(1)}</span>
            {count != null && <span className="text-muted-foreground">({count})</span>}
        </span>
    );
}

function EntityAvatar({ src, fallback, round }: {
    src?: string | null; fallback: string; round?: boolean;
}): React.ReactNode {
    const shape = round ? 'rounded-full' : 'rounded-lg';
    return src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className={cn('h-10 w-10 object-cover bg-muted shrink-0', shape)} />
    ) : (
        <div className={cn('h-10 w-10 flex items-center justify-center bg-primary/10 text-primary font-semibold text-sm shrink-0', shape)}>
            {fallback.charAt(0).toUpperCase()}
        </div>
    );
}

function RemoveBtn({ onClick }: { onClick: () => void }): React.ReactNode {
    const { t } = useTranslation();
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
                >
                    <HeartOff className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
                <p>{t('favorites.remove', 'Remove')}</p>
            </TooltipContent>
        </Tooltip>
    );
}

function SectionHead({ icon: Icon, title, count }: {
    icon: typeof Compass; title: string; count: number;
}): React.ReactNode {
    return (
        <div className="flex items-center gap-2.5 pb-2">
            <div className="p-1.5 rounded-md bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
            <Badge variant="secondary" className="text-xs tabular-nums">{count}</Badge>
        </div>
    );
}

function TableSkeleton({ rows = 3 }: { rows?: number }): React.ReactNode {
    return (
        <div className="space-y-1 rounded-xl border border-border/50 overflow-hidden">
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-14 hidden md:block" />
                    <Skeleton className="h-4 w-12 hidden md:block" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            ))}
        </div>
    );
}

function EmptySection({ msg }: { msg: string }): React.ReactNode {
    return (
        <div className="flex flex-col items-center py-10 text-center">
            <Heart className="h-8 w-8 text-muted-foreground/20 mb-2" />
            <p className="text-sm text-muted-foreground">{msg}</p>
        </div>
    );
}

/* ── Generic data hook ─────────────────────────────────── */

function useFavEntities<T extends { id: string }>(
    entityType: FavoriteEntityType,
    prefix: string,
    fetchFn: (id: string) => Promise<T>,
): { entities: T[]; favMap: Map<string, Favorite>; isLoading: boolean; count: number } {
    const { data, isLoading: fl } = useFavorites({ entityType, limit: 50 });
    const favs = useMemo(() => data?.items ?? [], [data?.items]);
    const ids = useMemo(() => favs.map(f => f.entityId), [favs]);

    const eq = useQueries({
        queries: ids.map(id => ({
            queryKey: [prefix, id],
            queryFn: () => fetchFn(id),
            staleTime: 300_000,
        })),
    });

    const isLoading = fl || eq.some(q => q.isLoading);
    const entities = useMemo(() => eq.filter(q => q.data).map(q => q.data!), [eq]);
    const favMap = useMemo(() => new Map(favs.map(f => [f.entityId, f])), [favs]);

    return { entities, favMap, isLoading, count: data?.pagination.totalItems ?? 0 };
}

/* ── Counts hook for tab badges ────────────────────────── */

function useFavCounts(): Record<FavoriteEntityType, number> & { total: number } {
    const { data: td } = useFavorites({ entityType: 'TOUR', limit: 1 });
    const { data: gd } = useFavorites({ entityType: 'GUIDE', limit: 1 });
    const { data: dd } = useFavorites({ entityType: 'DRIVER', limit: 1 });
    const { data: cd } = useFavorites({ entityType: 'COMPANY', limit: 1 });
    const c = {
        TOUR: td?.pagination.totalItems ?? 0,
        GUIDE: gd?.pagination.totalItems ?? 0,
        DRIVER: dd?.pagination.totalItems ?? 0,
        COMPANY: cd?.pagination.totalItems ?? 0,
    };
    return { ...c, total: c.TOUR + c.GUIDE + c.DRIVER + c.COMPANY };
}

/* ── TOUR Section ───────────────────────────────────────── */

function TourSection({ showHeader = true, showEmpty = true }: { showHeader?: boolean; showEmpty?: boolean }): React.ReactNode {
    const { t } = useTranslation();
    const { entities, favMap, isLoading, count } = useFavEntities<Tour>('TOUR', 'tour', fetchTour);
    const toggle = useToggleFavorite();
    const remove = useCallback((id: string): void => {
        toggle.mutate({ entityType: 'TOUR', entityId: id, isFavorited: true });
    }, [toggle]);

    if (isLoading) return <TableSkeleton />;
    if (!entities.length) return showEmpty ? <EmptySection msg={t('favorites.empty_tours', 'No saved tours')} /> : null;

    return (
        <div className="space-y-2">
            {showHeader && <SectionHead icon={Compass} title={t('favorites.tabs.tours', 'Tours')} count={count} />}
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead>{t('favorites.table.name', 'Name')}</TableHead>
                            <TableHead className="hidden md:table-cell text-right">{t('favorites.table.price', 'Price')}</TableHead>
                            <TableHead className="hidden lg:table-cell">{t('favorites.table.duration', 'Duration')}</TableHead>
                            <TableHead className="hidden sm:table-cell">{t('favorites.table.rating', 'Rating')}</TableHead>
                            <TableHead className="hidden xl:table-cell">{t('favorites.table.added', 'Saved')}</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entities.map(tour => (
                            <TableRow key={tour.id} className="group border-border/30">
                                <TableCell className="py-3">
                                    <Link href={`/explore/tours/${tour.id}`} className="flex items-center gap-3 min-w-0">
                                        <EntityAvatar src={tour.images?.[0]?.url} fallback={tour.title} />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate group-hover:text-primary transition-colors">{tour.title}</p>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                {tour.city && <><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{tour.city}</span></>}
                                                <span className="md:hidden font-medium text-foreground">{tour.city ? ' · ' : ''}{fmtPrice(tour.price, tour.currency)}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-right py-3">
                                    <span className="font-semibold">{fmtPrice(tour.price, tour.currency)}</span>
                                    {tour.originalPrice && Number(tour.originalPrice) > Number(tour.price) && (
                                        <span className="block text-xs text-muted-foreground line-through">{fmtPrice(tour.originalPrice, tour.currency)}</span>
                                    )}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell py-3 text-muted-foreground text-sm">
                                    {tour.durationMinutes
                                        ? <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{fmtDuration(tour.durationMinutes)}</span>
                                        : '-'}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell py-3">
                                    <RatingBadge rating={tour.averageRating} count={tour.reviewCount} />
                                </TableCell>
                                <TableCell className="hidden xl:table-cell py-3 text-xs text-muted-foreground">
                                    {favMap.get(tour.id)?.createdAt && timeAgo(favMap.get(tour.id)!.createdAt)}
                                </TableCell>
                                <TableCell className="py-3">
                                    <RemoveBtn onClick={() => remove(tour.id)} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

/* ── GUIDE Section ──────────────────────────────────────── */

function GuideSection({ showHeader = true, showEmpty = true }: { showHeader?: boolean; showEmpty?: boolean }): React.ReactNode {
    const { t } = useTranslation();
    const { entities, favMap, isLoading, count } = useFavEntities<Guide>('GUIDE', 'guide', fetchGuide);
    const toggle = useToggleFavorite();
    const remove = useCallback((id: string): void => {
        toggle.mutate({ entityType: 'GUIDE', entityId: id, isFavorited: true });
    }, [toggle]);

    if (isLoading) return <TableSkeleton />;
    if (!entities.length) return showEmpty ? <EmptySection msg={t('favorites.empty_guides', 'No saved guides')} /> : null;

    return (
        <div className="space-y-2">
            {showHeader && <SectionHead icon={Globe} title={t('favorites.tabs.guides', 'Guides')} count={count} />}
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead>{t('favorites.table.name', 'Name')}</TableHead>
                            <TableHead className="hidden md:table-cell">{t('favorites.table.languages', 'Languages')}</TableHead>
                            <TableHead className="hidden lg:table-cell text-right">{t('favorites.table.price_per_day', 'Price/Day')}</TableHead>
                            <TableHead className="hidden sm:table-cell">{t('favorites.table.rating', 'Rating')}</TableHead>
                            <TableHead className="hidden xl:table-cell">{t('favorites.table.added', 'Saved')}</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entities.map(guide => {
                            const name = `${guide.user?.firstName ?? ''} ${guide.user?.lastName ?? ''}`.trim();
                            return (
                                <TableRow key={guide.id} className="group border-border/30">
                                    <TableCell className="py-3">
                                        <Link href={`/explore/guides/${guide.id}`} className="flex items-center gap-3 min-w-0">
                                            <EntityAvatar src={guide.avatarUrl || guide.photoUrl} fallback={name || 'G'} round />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-medium truncate group-hover:text-primary transition-colors">{name || t('common.unknown', 'Unknown')}</p>
                                                    {guide.isVerified && <Shield className="h-3.5 w-3.5 text-primary shrink-0" />}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {guide.yearsOfExperience ? `${guide.yearsOfExperience}y exp` : ''}
                                                    <span className="lg:hidden font-medium text-foreground">
                                                        {guide.yearsOfExperience && guide.pricePerDay ? ' · ' : ''}
                                                        {guide.pricePerDay ? fmtPrice(guide.pricePerDay, guide.currency) + '/day' : ''}
                                                    </span>
                                                </p>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(guide.languages ?? []).slice(0, 3).map(lang => (
                                                <Badge key={lang} variant="outline" className="text-xs font-normal">{lang}</Badge>
                                            ))}
                                            {(guide.languages ?? []).length > 3 && (
                                                <Badge variant="outline" className="text-xs">+{guide.languages!.length - 3}</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-right py-3">
                                        {guide.pricePerDay ? <span className="font-semibold">{fmtPrice(guide.pricePerDay, guide.currency)}</span> : '-'}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell py-3">
                                        <RatingBadge rating={guide.averageRating} count={guide.reviewCount} />
                                    </TableCell>
                                    <TableCell className="hidden xl:table-cell py-3 text-xs text-muted-foreground">
                                        {favMap.get(guide.id)?.createdAt && timeAgo(favMap.get(guide.id)!.createdAt)}
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <RemoveBtn onClick={() => remove(guide.id)} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

/* ── DRIVER Section ─────────────────────────────────────── */

function DriverSection({ showHeader = true, showEmpty = true }: { showHeader?: boolean; showEmpty?: boolean }): React.ReactNode {
    const { t } = useTranslation();
    const { entities, favMap, isLoading, count } = useFavEntities<Driver>('DRIVER', 'driver', fetchDriver);
    const toggle = useToggleFavorite();
    const remove = useCallback((id: string): void => {
        toggle.mutate({ entityType: 'DRIVER', entityId: id, isFavorited: true });
    }, [toggle]);

    if (isLoading) return <TableSkeleton />;
    if (!entities.length) return showEmpty ? <EmptySection msg={t('favorites.empty_drivers', 'No saved drivers')} /> : null;

    return (
        <div className="space-y-2">
            {showHeader && <SectionHead icon={Car} title={t('favorites.tabs.drivers', 'Drivers')} count={count} />}
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead>{t('favorites.table.name', 'Name')}</TableHead>
                            <TableHead className="hidden md:table-cell">{t('favorites.table.vehicle', 'Vehicle')}</TableHead>
                            <TableHead className="hidden lg:table-cell text-right">{t('favorites.table.price_per_day', 'Price/Day')}</TableHead>
                            <TableHead className="hidden sm:table-cell">{t('favorites.table.rating', 'Rating')}</TableHead>
                            <TableHead className="hidden xl:table-cell">{t('favorites.table.added', 'Saved')}</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entities.map(driver => {
                            const name = `${driver.user?.firstName ?? ''} ${driver.user?.lastName ?? ''}`.trim();
                            const vehicle = [driver.vehicleMake, driver.vehicleModel].filter(Boolean).join(' ') || driver.vehicleType;
                            return (
                                <TableRow key={driver.id} className="group border-border/30">
                                    <TableCell className="py-3">
                                        <Link href={`/explore/drivers/${driver.id}`} className="flex items-center gap-3 min-w-0">
                                            <EntityAvatar src={driver.avatarUrl || driver.photoUrl} fallback={name || 'D'} round />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-medium truncate group-hover:text-primary transition-colors">{name || t('common.unknown', 'Unknown')}</p>
                                                    {driver.isVerified && <Shield className="h-3.5 w-3.5 text-primary shrink-0" />}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    <span className="md:hidden">{vehicle ? vehicle + ' · ' : ''}</span>
                                                    {driver.vehicleCapacity ? `${driver.vehicleCapacity} seats` : ''}
                                                    <span className="lg:hidden font-medium text-foreground">
                                                        {driver.pricePerDay ? ' · ' + fmtPrice(driver.pricePerDay, driver.currency) + '/day' : ''}
                                                    </span>
                                                </p>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell py-3">
                                        {vehicle ? (
                                            <div className="text-sm">
                                                <span>{vehicle}</span>
                                                {driver.vehicleYear && <span className="text-muted-foreground ml-1">({driver.vehicleYear})</span>}
                                            </div>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-right py-3">
                                        {driver.pricePerDay ? <span className="font-semibold">{fmtPrice(driver.pricePerDay, driver.currency)}</span> : '-'}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell py-3">
                                        <RatingBadge rating={driver.averageRating} count={driver.reviewCount} />
                                    </TableCell>
                                    <TableCell className="hidden xl:table-cell py-3 text-xs text-muted-foreground">
                                        {favMap.get(driver.id)?.createdAt && timeAgo(favMap.get(driver.id)!.createdAt)}
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <RemoveBtn onClick={() => remove(driver.id)} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

/* ── COMPANY Section ────────────────────────────────────── */

function CompanySection({ showHeader = true, showEmpty = true }: { showHeader?: boolean; showEmpty?: boolean }): React.ReactNode {
    const { t } = useTranslation();
    const { entities, favMap, isLoading, count } = useFavEntities<Company>('COMPANY', 'company', fetchCompany);
    const toggle = useToggleFavorite();
    const remove = useCallback((id: string): void => {
        toggle.mutate({ entityType: 'COMPANY', entityId: id, isFavorited: true });
    }, [toggle]);

    if (isLoading) return <TableSkeleton />;
    if (!entities.length) return showEmpty ? <EmptySection msg={t('favorites.empty_companies', 'No saved companies')} /> : null;

    return (
        <div className="space-y-2">
            {showHeader && <SectionHead icon={Building2} title={t('favorites.tabs.companies', 'Companies')} count={count} />}
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead>{t('favorites.table.name', 'Name')}</TableHead>
                            <TableHead className="hidden sm:table-cell">{t('favorites.table.rating', 'Rating')}</TableHead>
                            <TableHead className="hidden xl:table-cell">{t('favorites.table.added', 'Saved')}</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entities.map(company => (
                            <TableRow key={company.id} className="group border-border/30">
                                <TableCell className="py-3">
                                    <Link href={`/explore/companies/${company.id}`} className="flex items-center gap-3 min-w-0">
                                        <EntityAvatar src={company.logoUrl} fallback={company.companyName || 'C'} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-medium truncate group-hover:text-primary transition-colors">{company.companyName}</p>
                                                {company.isVerified && <Shield className="h-3.5 w-3.5 text-primary shrink-0" />}
                                            </div>
                                            {company.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{company.description}</p>
                                            )}
                                        </div>
                                    </Link>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell py-3">
                                    <RatingBadge rating={company.averageRating} count={company.reviewCount} />
                                </TableCell>
                                <TableCell className="hidden xl:table-cell py-3 text-xs text-muted-foreground">
                                    {favMap.get(company.id)?.createdAt && timeAgo(favMap.get(company.id)!.createdAt)}
                                </TableCell>
                                <TableCell className="py-3">
                                    <RemoveBtn onClick={() => remove(company.id)} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

/* ── All Favorites ──────────────────────────────────────── */

function AllContent(): React.ReactNode {
    const counts = useFavCounts();
    if (counts.total === 0) return <GlobalEmpty />;

    return (
        <div className="space-y-8">
            {counts.TOUR > 0 && <TourSection showEmpty={false} />}
            {counts.GUIDE > 0 && <GuideSection showEmpty={false} />}
            {counts.DRIVER > 0 && <DriverSection showEmpty={false} />}
            {counts.COMPANY > 0 && <CompanySection showEmpty={false} />}
        </div>
    );
}

function GlobalEmpty(): React.ReactNode {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Sparkles className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t('favorites.empty_title', 'No favorites yet')}</h3>
            <p className="text-muted-foreground text-sm max-w-sm text-center mb-6">
                {t('favorites.empty_description', 'Browse tours, guides, and drivers to save your favorites.')}
            </p>
            <Link href="/explore/tours">
                <Button variant="outline" size="sm">
                    <Compass className="mr-2 h-4 w-4" />
                    {t('favorites.browse_tours', 'Browse Tours')}
                </Button>
            </Link>
        </div>
    );
}

/* ── Page ─────────────────────────────────────────────────── */

const TABS: { value: TabValue; labelKey: string; fallback: string; entityType?: FavoriteEntityType }[] = [
    { value: 'ALL', labelKey: 'favorites.tabs.all', fallback: 'All' },
    { value: 'TOUR', labelKey: 'favorites.tabs.tours', fallback: 'Tours', entityType: 'TOUR' },
    { value: 'GUIDE', labelKey: 'favorites.tabs.guides', fallback: 'Guides', entityType: 'GUIDE' },
    { value: 'DRIVER', labelKey: 'favorites.tabs.drivers', fallback: 'Drivers', entityType: 'DRIVER' },
    { value: 'COMPANY', labelKey: 'favorites.tabs.companies', fallback: 'Companies', entityType: 'COMPANY' },
];

export default function FavoritesPage(): React.ReactNode {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabValue>('ALL');
    const counts = useFavCounts();

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('favorites.title', 'My Favorites')}</h1>
                    <p className="text-muted-foreground">
                        {counts.total > 0
                            ? t('favorites.summary', '{{count}} saved items across your collections', { count: counts.total })
                            : t('favorites.description', 'Your saved tours, guides, drivers, and companies.')}
                    </p>
                </div>

                {/* Stats cards */}
                {counts.total > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {([
                            { type: 'TOUR' as const, icon: Compass, label: t('favorites.tabs.tours', 'Tours') },
                            { type: 'GUIDE' as const, icon: Globe, label: t('favorites.tabs.guides', 'Guides') },
                            { type: 'DRIVER' as const, icon: Car, label: t('favorites.tabs.drivers', 'Drivers') },
                            { type: 'COMPANY' as const, icon: Building2, label: t('favorites.tabs.companies', 'Companies') },
                        ]).map(({ type, icon: Icon, label }) => (
                            <button
                                key={type}
                                onClick={() => setActiveTab(type)}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left',
                                    activeTab === type
                                        ? 'border-primary/30 bg-primary/5 shadow-sm'
                                        : 'border-border/50 bg-card hover:border-border hover:shadow-sm',
                                )}
                            >
                                <div className={cn('p-2 rounded-lg', activeTab === type ? 'bg-primary/10' : 'bg-muted/50')}>
                                    <Icon className={cn('h-4 w-4', activeTab === type ? 'text-primary' : 'text-muted-foreground')} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold tabular-nums leading-none">{counts[type]}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 border-b border-border pb-px overflow-x-auto">
                    {TABS.map(tab => {
                        const tabCount = tab.entityType ? counts[tab.entityType] : counts.total;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap inline-flex items-center gap-2',
                                    activeTab === tab.value
                                        ? 'bg-primary/10 text-primary border-b-2 border-primary -mb-px'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                                )}
                            >
                                {t(tab.labelKey, tab.fallback)}
                                {tabCount > 0 && (
                                    <span className={cn(
                                        'text-xs tabular-nums px-1.5 py-0.5 rounded-full',
                                        activeTab === tab.value ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                                    )}>
                                        {tabCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                {activeTab === 'ALL' && <AllContent />}
                {activeTab === 'TOUR' && <TourSection showHeader={false} />}
                {activeTab === 'GUIDE' && <GuideSection showHeader={false} />}
                {activeTab === 'DRIVER' && <DriverSection showHeader={false} />}
                {activeTab === 'COMPANY' && <CompanySection showHeader={false} />}
            </div>
        </TooltipProvider>
    );
}

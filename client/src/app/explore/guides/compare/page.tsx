'use client';

import type { ReactNode } from 'react';
import { Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, User, Loader2, Star, ShieldCheck,
  MapPin, Calendar, MessageSquare, ArrowRight,
  X, Minus, Languages, Briefcase, DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileCompareView } from './MobileCompareView';
import { useGuide } from '@/features/guides/hooks/useGuides';
import { useCompareSelection } from '@/hooks/useCompareSelection';
import type { Guide } from '@/features/guides/types/guide.types';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants/routes';
import { isValidUuid } from '@/lib/utils/validation';
import { getMediaUrl } from '@/lib/utils/media';
import { useCurrency } from '@/context/CurrencyContext';

// ─── Helpers ─────────────────────────────────────────────────────────

function gridCols(count: number): React.CSSProperties {
  return { gridTemplateColumns: `160px repeat(${count}, 1fr)` };
}

function getGuideName(guide: Guide): string {
  return guide.user ? `${guide.user.firstName} ${guide.user.lastName}` : 'Unknown Guide';
}

interface CompareRowProps {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  colCount: number;
  noBorder?: boolean;
}

function CompareRow({ label, icon, children, colCount, noBorder }: CompareRowProps): ReactNode {
  return (
    <div
      className={cn("grid items-center gap-4 px-4 py-3.5", !noBorder && "border-b border-border/50")}
      style={gridCols(colCount)}
      role="row"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="rowheader">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────

function SkeletonTable({ count }: { count: number }): ReactNode {
  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden animate-pulse">
      <div className="grid gap-4 px-4 py-5 border-b border-border/50 bg-muted/30" style={gridCols(count)}>
        <div />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-xl bg-muted" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="grid gap-4 px-4 py-3.5 border-b border-border/50" style={gridCols(count)}>
          <div className="h-4 w-20 bg-muted rounded" />
          {Array.from({ length: count }).map((_, j) => (
            <div key={j} className="h-4 w-16 bg-muted rounded mx-auto" />
          ))}
        </div>
      ))}
    </div>
  );
}

function MobileSkeletonTable({ count }: { count: number }): ReactNode {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/50 border-l-[3px] border-l-muted bg-card">
            <div className="h-9 w-9 rounded-lg bg-muted shrink-0" />
            <div className="h-4 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/50">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
          {Array.from({ length: count }).map((_, j) => (
            <div key={j} className="px-4 py-3 border-b border-border/30 last:border-b-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-8 rounded bg-muted" />
              </div>
              <div className="h-2 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main Content ────────────────────────────────────────────────────

function CompareGuidesContent(): ReactNode {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { remove: removeFromStorage } = useCompareSelection('compare-guides', 3, 'guides');

  const idsParam = searchParams.get('ids') ?? '';
  const ids = idsParam.split(',').filter(isValidUuid).slice(0, 3);

  const query1 = useGuide(ids[0] ?? '');
  const query2 = useGuide(ids[1] ?? '');
  const query3 = useGuide(ids[2] ?? '');
  const queries = [query1, query2, query3].slice(0, ids.length);
  const isLoading = queries.some((q) => q.isLoading);
  const guides = queries
    .map((q) => q.data)
    .filter((g): g is Guide => g !== undefined && g !== null);

  const handleRemove = useCallback(
    (id: string): void => {
      removeFromStorage(id);
      const remaining = ids.filter((i) => i !== id);
      if (remaining.length === 0) {
        router.replace(ROUTES.EXPLORE.GUIDES);
      } else {
        router.replace(`${ROUTES.EXPLORE.GUIDES_COMPARE}?ids=${remaining.join(',')}`);
      }
    },
    [ids, router, removeFromStorage]
  );

  // Empty state
  if (ids.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-20">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <User className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">{t('compare_guides.no_items_title')}</h2>
          <p className="text-muted-foreground mb-6">{t('compare_guides.no_items_desc')}</p>
          <Button onClick={() => router.push(ROUTES.EXPLORE.GUIDES)} className="rounded-xl h-11 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('compare_guides.browse')}
          </Button>
        </div>
      </div>
    );
  }

  const colCount = guides.length || ids.length;

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      {/* Page Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 min-[900px]:py-4 flex items-center gap-2 min-[900px]:justify-between">
          <Button variant="ghost" onClick={() => router.push(ROUTES.EXPLORE.GUIDES)} className="gap-2 rounded-xl p-2 sm:px-4 shrink-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('compare_guides.back')}</span>
          </Button>
          <h1 className="text-base sm:text-lg min-[900px]:text-xl font-bold text-foreground">
            {t('compare_guides.title')}
            {!isLoading && <span className="text-muted-foreground font-normal ml-2">({guides.length})</span>}
          </h1>
          <div className="hidden min-[900px]:block w-[100px] shrink-0" />
        </div>
      </div>

      {/* Comparison Table */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <>
            <div className="hidden min-[900px]:block">
              <SkeletonTable count={ids.length} />
            </div>
            <div className="min-[900px]:hidden">
              <MobileSkeletonTable count={ids.length} />
            </div>
          </>
        ) : (
          <>
            {/* Desktop Table (≥ 900px) */}
            <div className="hidden min-[900px]:block">
              <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]" role="table" aria-label={t('compare_guides.title')}>
                {/* Guide Headers */}
                <div className="grid gap-4 px-4 py-5 border-b border-border/50 bg-muted/30" style={gridCols(colCount)} role="row">
                  <div role="columnheader" />
                  {guides.map((guide) => {
                    const photoUrl = guide.avatarUrl
                      ? getMediaUrl(guide.avatarUrl)
                      : guide.photos?.length
                        ? getMediaUrl(guide.photos[0].url)
                        : guide.photoUrl
                          ? getMediaUrl(guide.photoUrl)
                          : null;
                    const name = getGuideName(guide);
                    return (
                      <div key={guide.id} className="flex flex-col items-center text-center gap-2" role="columnheader">
                        {photoUrl ? (
                          <img src={photoUrl} alt="" className="h-14 w-14 rounded-xl object-cover border border-border/50" />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
                            <User className="h-7 w-7 text-muted-foreground/50" />
                          </div>
                        )}
                        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                          {name}
                        </h3>
                        <button
                          onClick={() => handleRemove(guide.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg"
                          aria-label={`${t('compare.remove')} ${name}`}
                        >
                          <X className="h-3 w-3" />
                          {t('compare.remove')}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Rating */}
                <CompareRow label={t('compare.fields.rating')} icon={<Star className="h-4 w-4" />} colCount={colCount}>
                  {guides.map((g) => {
                    const rating = g.averageRating ? Number(g.averageRating) : null;
                    return (
                      <div key={g.id} className="flex items-center justify-center gap-1.5" role="cell">
                        {rating ? (
                          <>
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            <span className="font-bold text-foreground">{rating.toFixed(1)}</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">{t('compare.fields.new_rating')}</span>
                        )}
                      </div>
                    );
                  })}
                </CompareRow>

                {/* Reviews */}
                <CompareRow label={t('compare.fields.reviews')} icon={<MessageSquare className="h-4 w-4" />} colCount={colCount}>
                  {guides.map((g) => (
                    <div key={g.id} className="text-center font-semibold text-foreground" role="cell">{g.reviewCount}</div>
                  ))}
                </CompareRow>

                {/* Experience */}
                <CompareRow label={t('compare_guides.fields.experience')} icon={<Briefcase className="h-4 w-4" />} colCount={colCount}>
                  {guides.map((g) => (
                    <div key={g.id} className="text-center text-sm font-medium text-foreground" role="cell">
                      {g.yearsOfExperience ? `${g.yearsOfExperience} ${t('common.years')}` : <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                    </div>
                  ))}
                </CompareRow>

                {/* Verified */}
                <CompareRow label={t('compare.fields.verified')} icon={<ShieldCheck className="h-4 w-4" />} colCount={colCount}>
                  {guides.map((g) => (
                    <div key={g.id} className="flex items-center justify-center" role="cell">
                      {g.isVerified ? (
                        <span className="flex items-center gap-1 text-sm font-medium text-success">
                          <ShieldCheck className="h-4 w-4" /> {t('compare.fields.verified')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Minus className="h-4 w-4" /> {t('compare.fields.not_verified')}
                        </span>
                      )}
                    </div>
                  ))}
                </CompareRow>

                {/* Languages */}
                <CompareRow label={t('compare_guides.fields.languages')} icon={<Languages className="h-4 w-4" />} colCount={colCount}>
                  {guides.map((g) => (
                    <div key={g.id} className="text-sm text-foreground text-center" role="cell">
                      {g.languages && g.languages.length > 0
                        ? g.languages.join(', ')
                        : <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                    </div>
                  ))}
                </CompareRow>

                {/* Location */}
                <CompareRow label={t('compare_guides.fields.location')} icon={<MapPin className="h-4 w-4" />} colCount={colCount}>
                  {guides.map((g) => {
                    const locationNames = g.locations?.map((loc) => {
                      if ('location' in loc && loc.location) return loc.location.name;
                      if ('name' in loc) return (loc as { name: string }).name;
                      return null;
                    }).filter(Boolean) ?? [];
                    return (
                      <div key={g.id} className="text-center text-sm text-foreground" role="cell">
                        {locationNames.length > 0
                          ? locationNames.join(', ')
                          : <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                      </div>
                    );
                  })}
                </CompareRow>

                {/* Price per Day */}
                <CompareRow label={t('compare_guides.fields.price_per_day')} icon={<DollarSign className="h-4 w-4" />} colCount={colCount}>
                  {guides.map((g) => (
                    <div key={g.id} className="text-center text-sm font-medium text-foreground" role="cell">
                      {g.pricePerDay
                        ? formatPrice(Number(g.pricePerDay), g.currency || 'GEL')
                        : <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                    </div>
                  ))}
                </CompareRow>

                {/* Member Since */}
                <CompareRow label={t('compare.fields.member_since')} icon={<Calendar className="h-4 w-4" />} colCount={colCount} noBorder>
                  {guides.map((g) => (
                    <div key={g.id} className="text-center text-sm font-medium text-foreground" role="cell">
                      {new Date(g.createdAt).getFullYear()}
                    </div>
                  ))}
                </CompareRow>

                {/* View Details */}
                <div className="grid gap-4 px-4 py-4 border-t border-border/50 bg-muted/20" style={gridCols(colCount)}>
                  <div />
                  {guides.map((g) => (
                    <div key={g.id} className="flex justify-center">
                      <Button variant="outline" onClick={() => router.push(`/explore/guides/${g.id}`)} className="rounded-xl h-10 gap-2 text-sm">
                        {t('compare.view_details')}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile View (< 900px) */}
            <div className="min-[900px]:hidden">
              <MobileCompareView
                guides={guides}
                onRemove={handleRemove}
                onViewDetails={(id: string) => router.push(`/explore/guides/${id}`)}
                t={t}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────

function ComparePageLoading(): ReactNode {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

export default function CompareGuidesPage(): ReactNode {
  return (
    <Suspense fallback={<ComparePageLoading />}>
      <CompareGuidesContent />
    </Suspense>
  );
}

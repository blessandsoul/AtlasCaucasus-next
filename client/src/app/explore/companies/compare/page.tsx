'use client';

import type { ReactNode } from 'react';
import { Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Building2, Loader2, Star, ShieldCheck,
  Globe, Phone, Calendar, MessageSquare, ArrowRight,
  X, Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileCompareView } from './MobileCompareView';
import { useCompany } from '@/features/companies/hooks/useCompanies';
import { useCompareSelection } from '@/hooks/useCompareSelection';
import type { Company } from '@/features/companies/types/company.types';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants/routes';
import { isValidUuid } from '@/lib/utils/validation';
import { getMediaUrl } from '@/lib/utils/media';

// ─── Helpers ─────────────────────────────────────────────────────────

function gridCols(count: number): React.CSSProperties {
  return { gridTemplateColumns: `160px repeat(${count}, 1fr)` };
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

function CompareCompaniesContent(): ReactNode {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { remove: removeFromStorage } = useCompareSelection('compare-companies', 3, 'companies');

  const idsParam = searchParams.get('ids') ?? '';
  const ids = idsParam.split(',').filter(isValidUuid).slice(0, 3);

  const query1 = useCompany(ids[0] ?? '');
  const query2 = useCompany(ids[1] ?? '');
  const query3 = useCompany(ids[2] ?? '');
  const queries = [query1, query2, query3].slice(0, ids.length);
  const isLoading = queries.some((q) => q.isLoading);
  const companies = queries
    .map((q) => q.data)
    .filter((c): c is Company => c !== undefined && c !== null);

  const handleRemove = useCallback(
    (id: string): void => {
      removeFromStorage(id);
      const remaining = ids.filter((i) => i !== id);
      if (remaining.length === 0) {
        router.replace(ROUTES.EXPLORE.COMPANIES);
      } else {
        router.replace(`${ROUTES.EXPLORE.COMPANIES_COMPARE}?ids=${remaining.join(',')}`);
      }
    },
    [ids, router, removeFromStorage]
  );

  // Empty state
  if (ids.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-20">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">{t('compare.no_companies_title')}</h2>
          <p className="text-muted-foreground mb-6">{t('compare.no_companies_desc')}</p>
          <Button onClick={() => router.push(ROUTES.EXPLORE.COMPANIES)} className="rounded-xl h-11 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('compare.browse_companies')}
          </Button>
        </div>
      </div>
    );
  }

  const colCount = companies.length || ids.length;

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      {/* Page Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 min-[900px]:py-4 flex items-center gap-2 min-[900px]:justify-between">
          <Button variant="ghost" onClick={() => router.push(ROUTES.EXPLORE.COMPANIES)} className="gap-2 rounded-xl p-2 sm:px-4 shrink-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('compare.back')}</span>
          </Button>
          <h1 className="text-base sm:text-lg min-[900px]:text-xl font-bold text-foreground">
            {t('compare.title')}
            {!isLoading && <span className="text-muted-foreground font-normal ml-2">({companies.length})</span>}
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
                  <div className="min-w-[600px]" role="table" aria-label={t('compare.title')}>
                {/* Company Headers */}
                <div className="grid gap-4 px-4 py-5 border-b border-border/50 bg-muted/30" style={gridCols(colCount)} role="row">
                  <div role="columnheader" />
                  {companies.map((company) => {
                    const imageUrl = company.images?.length
                      ? getMediaUrl(company.images[0].url)
                      : company.logoUrl
                        ? getMediaUrl(company.logoUrl)
                        : null;
                    return (
                      <div key={company.id} className="flex flex-col items-center text-center gap-2" role="columnheader">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover border border-border/50" />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
                            <Building2 className="h-7 w-7 text-muted-foreground/50" />
                          </div>
                        )}
                        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                          {company.companyName}
                        </h3>
                        <button
                          onClick={() => handleRemove(company.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg"
                          aria-label={`${t('compare.remove')} ${company.companyName}`}
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
                  {companies.map((c) => {
                    const rating = c.averageRating ? Number(c.averageRating) : null;
                    return (
                      <div key={c.id} className="flex items-center justify-center gap-1.5" role="cell">
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
                  {companies.map((c) => (
                    <div key={c.id} className="text-center font-semibold text-foreground" role="cell">{c.reviewCount}</div>
                  ))}
                </CompareRow>

                {/* Verified */}
                <CompareRow label={t('compare.fields.verified')} icon={<ShieldCheck className="h-4 w-4" />} colCount={colCount}>
                  {companies.map((c) => (
                    <div key={c.id} className="flex items-center justify-center" role="cell">
                      {c.isVerified ? (
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

                {/* Description */}
                <CompareRow label={t('compare.fields.description')} icon={<Building2 className="h-4 w-4" />} colCount={colCount}>
                  {companies.map((c) => (
                    <div key={c.id} className="text-sm text-foreground line-clamp-3 text-center" role="cell">
                      {c.description || <span className="text-muted-foreground">{t('compare.fields.no_description')}</span>}
                    </div>
                  ))}
                </CompareRow>

                {/* Website */}
                <CompareRow label={t('compare.fields.website')} icon={<Globe className="h-4 w-4" />} colCount={colCount}>
                  {companies.map((c) => (
                    <div key={c.id} className="text-center" role="cell">
                      {c.websiteUrl ? (
                        <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline truncate inline-block max-w-[160px]">
                          {c.websiteUrl.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </div>
                  ))}
                </CompareRow>

                {/* Phone */}
                <CompareRow label={t('compare.fields.phone')} icon={<Phone className="h-4 w-4" />} colCount={colCount}>
                  {companies.map((c) => (
                    <div key={c.id} className="text-center text-sm font-medium text-foreground" role="cell">
                      {c.phoneNumber || <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                    </div>
                  ))}
                </CompareRow>

                {/* Member Since */}
                <CompareRow label={t('compare.fields.member_since')} icon={<Calendar className="h-4 w-4" />} colCount={colCount} noBorder>
                  {companies.map((c) => (
                    <div key={c.id} className="text-center text-sm font-medium text-foreground" role="cell">
                      {new Date(c.createdAt).getFullYear()}
                    </div>
                  ))}
                </CompareRow>

                {/* View Details */}
                <div className="grid gap-4 px-4 py-4 border-t border-border/50 bg-muted/20" style={gridCols(colCount)}>
                  <div />
                  {companies.map((c) => (
                    <div key={c.id} className="flex justify-center">
                      <Button variant="outline" onClick={() => router.push(`/explore/companies/${c.id}`)} className="rounded-xl h-10 gap-2 text-sm">
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
                companies={companies}
                onRemove={handleRemove}
                onViewDetails={(id: string) => router.push(`/explore/companies/${id}`)}
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

export default function CompareCompaniesPage(): ReactNode {
  return (
    <Suspense fallback={<ComparePageLoading />}>
      <CompareCompaniesContent />
    </Suspense>
  );
}

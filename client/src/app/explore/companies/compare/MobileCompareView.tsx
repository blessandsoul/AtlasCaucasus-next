'use client';

import type { ReactNode } from 'react';
import {
  Star, ShieldCheck, Globe, Phone, Calendar,
  MessageSquare, Building2, ArrowRight, X, Minus,
  Trophy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Company } from '@/features/companies/types/company.types';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media';

// ─── Types ───────────────────────────────────────────────────────────

interface MobileCompareViewProps {
  companies: Company[];
  onRemove: (id: string) => void;
  onViewDetails: (id: string) => void;
  t: (key: string) => string;
}

// ─── Company color accents (semantic tokens from design system) ──────

const ACCENTS = [
  { dot: 'bg-primary', bar: 'bg-primary', ring: 'ring-primary/20', border: 'border-l-primary' },
  { dot: 'bg-success', bar: 'bg-success', ring: 'ring-success/20', border: 'border-l-success' },
  { dot: 'bg-warning', bar: 'bg-warning', ring: 'ring-warning/20', border: 'border-l-warning' },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────

function findBestIndex(values: (number | null)[]): number {
  let bestIdx = -1;
  let bestVal = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v !== null && v > bestVal) {
      bestVal = v;
      bestIdx = i;
    }
  }
  const unique = new Set(values.filter((v): v is number => v !== null));
  return unique.size > 1 ? bestIdx : -1;
}

// ─── Sub-components ──────────────────────────────────────────────────

function AttributeCard({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }): ReactNode {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/50">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <div className="divide-y divide-border/30">{children}</div>
    </div>
  );
}

function BarRow({
  name,
  displayValue,
  percentage,
  accentIdx,
  isBest,
}: {
  name: string;
  displayValue: string;
  percentage: number;
  accentIdx: number;
  isBest: boolean;
}): ReactNode {
  const accent = ACCENTS[accentIdx] ?? ACCENTS[0];
  return (
    <div className={cn('px-4 py-3 transition-colors', isBest && 'bg-muted/40')}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('h-2 w-2 rounded-full shrink-0', accent.dot)} />
          <span className="text-sm text-foreground truncate">{name}</span>
          {isBest && <Trophy className="h-3.5 w-3.5 text-warning shrink-0" />}
        </div>
        <span
          className={cn(
            'text-sm font-bold tabular-nums shrink-0 ml-2',
            isBest ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {displayValue}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            accent.bar,
            isBest ? 'opacity-100' : 'opacity-50',
          )}
          style={{ width: `${Math.max(percentage, 4)}%` }}
        />
      </div>
    </div>
  );
}

function TextRow({
  name,
  accentIdx,
  children,
}: {
  name: string;
  accentIdx: number;
  children: ReactNode;
}): ReactNode {
  const accent = ACCENTS[accentIdx] ?? ACCENTS[0];
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2">
        <div className={cn('h-2 w-2 rounded-full shrink-0 mt-1.5', accent.dot)} />
        <div className="min-w-0 flex-1">
          <span className="text-xs text-muted-foreground">{name}</span>
          <div className="mt-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function MobileCompareView({ companies, onRemove, onViewDetails, t }: MobileCompareViewProps): ReactNode {
  const ratings = companies.map((c) => (c.averageRating ? Number(c.averageRating) : null));
  const reviewCounts = companies.map((c) => c.reviewCount ?? 0);
  const maxReviews = Math.max(...reviewCounts, 1);
  const bestRatingIdx = findBestIndex(ratings);
  const bestReviewIdx = findBestIndex(reviewCounts);

  return (
    <div className="space-y-3">
      {/* ── Company Headers ─────────────────────────────────────── */}
      <div className="space-y-2">
        {companies.map((company, i) => {
          const imageUrl = company.images?.length
            ? getMediaUrl(company.images[0].url)
            : company.logoUrl
              ? getMediaUrl(company.logoUrl)
              : null;
          const accent = ACCENTS[i] ?? ACCENTS[0];
          return (
            <div
              key={company.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'bg-card border border-border/50 border-l-[3px]',
                accent.border,
              )}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover border border-border/50 shrink-0" />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Building2 className="h-4.5 w-4.5 text-muted-foreground/50" />
                </div>
              )}

              <h3 className="text-sm font-semibold text-foreground truncate flex-1 min-w-0">
                {company.companyName}
              </h3>

              <button
                onClick={() => onRemove(company.id)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                aria-label={`${t('compare.remove')} ${company.companyName}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Rating ──────────────────────────────────────────────── */}
      <AttributeCard icon={<Star className="h-4 w-4" />} label={t('compare.fields.rating')}>
        {companies.map((c, i) => {
          const rating = ratings[i];
          return (
            <BarRow
              key={c.id}
              name={c.companyName}
              displayValue={rating !== null ? `★ ${rating.toFixed(1)}` : t('compare.fields.new_rating')}
              percentage={rating !== null ? (rating / 5) * 100 : 0}
              accentIdx={i}
              isBest={i === bestRatingIdx}
            />
          );
        })}
      </AttributeCard>

      {/* ── Reviews ─────────────────────────────────────────────── */}
      <AttributeCard icon={<MessageSquare className="h-4 w-4" />} label={t('compare.fields.reviews')}>
        {companies.map((c, i) => (
          <BarRow
            key={c.id}
            name={c.companyName}
            displayValue={String(reviewCounts[i])}
            percentage={(reviewCounts[i] / maxReviews) * 100}
            accentIdx={i}
            isBest={i === bestReviewIdx}
          />
        ))}
      </AttributeCard>

      {/* ── Verified ────────────────────────────────────────────── */}
      <AttributeCard icon={<ShieldCheck className="h-4 w-4" />} label={t('compare.fields.verified')}>
        {companies.map((c, i) => (
          <TextRow key={c.id} name={c.companyName} accentIdx={i}>
            {c.isVerified ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('compare.fields.verified')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Minus className="h-3.5 w-3.5" />
                {t('compare.fields.not_verified')}
              </span>
            )}
          </TextRow>
        ))}
      </AttributeCard>

      {/* ── Description ─────────────────────────────────────────── */}
      <AttributeCard icon={<Building2 className="h-4 w-4" />} label={t('compare.fields.description')}>
        {companies.map((c, i) => (
          <TextRow key={c.id} name={c.companyName} accentIdx={i}>
            <p className="text-sm text-foreground line-clamp-3">
              {c.description || (
                <span className="text-muted-foreground italic">{t('compare.fields.no_description')}</span>
              )}
            </p>
          </TextRow>
        ))}
      </AttributeCard>

      {/* ── Website ─────────────────────────────────────────────── */}
      <AttributeCard icon={<Globe className="h-4 w-4" />} label={t('compare.fields.website')}>
        {companies.map((c, i) => (
          <TextRow key={c.id} name={c.companyName} accentIdx={i}>
            {c.websiteUrl ? (
              <a
                href={c.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate block"
              >
                {c.websiteUrl.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
          </TextRow>
        ))}
      </AttributeCard>

      {/* ── Phone ───────────────────────────────────────────────── */}
      <AttributeCard icon={<Phone className="h-4 w-4" />} label={t('compare.fields.phone')}>
        {companies.map((c, i) => (
          <TextRow key={c.id} name={c.companyName} accentIdx={i}>
            <span className="text-sm font-medium text-foreground">
              {c.phoneNumber || <Minus className="h-4 w-4 text-muted-foreground inline-block" />}
            </span>
          </TextRow>
        ))}
      </AttributeCard>

      {/* ── Member Since ────────────────────────────────────────── */}
      <AttributeCard icon={<Calendar className="h-4 w-4" />} label={t('compare.fields.member_since')}>
        {companies.map((c, i) => (
          <TextRow key={c.id} name={c.companyName} accentIdx={i}>
            <span className="text-sm font-medium text-foreground">
              {new Date(c.createdAt).getFullYear()}
            </span>
          </TextRow>
        ))}
      </AttributeCard>

      {/* ── View Details ────────────────────────────────────────── */}
      <div className="space-y-2 pt-2">
        {companies.map((c, i) => {
          const accent = ACCENTS[i] ?? ACCENTS[0];
          return (
            <Button
              key={c.id}
              variant="outline"
              onClick={() => onViewDetails(c.id)}
              className="w-full rounded-xl h-11 gap-2 justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn('h-2 w-2 rounded-full shrink-0', accent.dot)} />
                <span className="truncate">{c.companyName}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground">{t('compare.view_details')}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

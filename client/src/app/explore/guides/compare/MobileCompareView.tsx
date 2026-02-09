'use client';

import type { ReactNode } from 'react';
import {
  Star, ShieldCheck, MapPin, Calendar,
  MessageSquare, User, ArrowRight, X, Minus,
  Trophy, Languages, Briefcase, DollarSign,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Guide } from '@/features/guides/types/guide.types';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media';
import { useCurrency } from '@/context/CurrencyContext';

// ─── Types ───────────────────────────────────────────────────────────

interface MobileCompareViewProps {
  guides: Guide[];
  onRemove: (id: string) => void;
  onViewDetails: (id: string) => void;
  t: (key: string) => string;
}

// ─── Color accents ──────────────────────────────────────────────────

const ACCENTS = [
  { dot: 'bg-primary', bar: 'bg-primary', ring: 'ring-primary/20', border: 'border-l-primary' },
  { dot: 'bg-success', bar: 'bg-success', ring: 'ring-success/20', border: 'border-l-success' },
  { dot: 'bg-warning', bar: 'bg-warning', ring: 'ring-warning/20', border: 'border-l-warning' },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────

function getGuideName(guide: Guide): string {
  return guide.user ? `${guide.user.firstName} ${guide.user.lastName}` : 'Unknown Guide';
}

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

export function MobileCompareView({ guides, onRemove, onViewDetails, t }: MobileCompareViewProps): ReactNode {
  const { formatPrice } = useCurrency();
  const ratings = guides.map((g) => (g.averageRating ? Number(g.averageRating) : null));
  const reviewCounts = guides.map((g) => g.reviewCount ?? 0);
  const maxReviews = Math.max(...reviewCounts, 1);
  const bestRatingIdx = findBestIndex(ratings);
  const bestReviewIdx = findBestIndex(reviewCounts);

  const experiences = guides.map((g) => g.yearsOfExperience ?? null);
  const bestExpIdx = findBestIndex(experiences);
  const maxExp = Math.max(...experiences.filter((v): v is number => v !== null), 1);

  return (
    <div className="space-y-3">
      {/* ── Guide Headers ─────────────────────────────────────── */}
      <div className="space-y-2">
        {guides.map((guide, i) => {
          const photoUrl = guide.avatarUrl
            ? getMediaUrl(guide.avatarUrl)
            : guide.photos?.length
              ? getMediaUrl(guide.photos[0].url)
              : guide.photoUrl
                ? getMediaUrl(guide.photoUrl)
                : null;
          const accent = ACCENTS[i] ?? ACCENTS[0];
          const name = getGuideName(guide);
          return (
            <div
              key={guide.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'bg-card border border-border/50 border-l-[3px]',
                accent.border,
              )}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-9 w-9 rounded-lg object-cover border border-border/50 shrink-0" />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4.5 w-4.5 text-muted-foreground/50" />
                </div>
              )}

              <h3 className="text-sm font-semibold text-foreground truncate flex-1 min-w-0">
                {name}
              </h3>

              <button
                onClick={() => onRemove(guide.id)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                aria-label={`${t('compare.remove')} ${name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Rating ──────────────────────────────────────────────── */}
      <AttributeCard icon={<Star className="h-4 w-4" />} label={t('compare.fields.rating')}>
        {guides.map((g, i) => {
          const rating = ratings[i];
          return (
            <BarRow
              key={g.id}
              name={getGuideName(g)}
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
        {guides.map((g, i) => (
          <BarRow
            key={g.id}
            name={getGuideName(g)}
            displayValue={String(reviewCounts[i])}
            percentage={(reviewCounts[i] / maxReviews) * 100}
            accentIdx={i}
            isBest={i === bestReviewIdx}
          />
        ))}
      </AttributeCard>

      {/* ── Experience ────────────────────────────────────────── */}
      <AttributeCard icon={<Briefcase className="h-4 w-4" />} label={t('compare_guides.fields.experience')}>
        {guides.map((g, i) => {
          const exp = experiences[i];
          return (
            <BarRow
              key={g.id}
              name={getGuideName(g)}
              displayValue={exp !== null ? `${exp} ${t('common.years')}` : '-'}
              percentage={exp !== null ? (exp / maxExp) * 100 : 0}
              accentIdx={i}
              isBest={i === bestExpIdx}
            />
          );
        })}
      </AttributeCard>

      {/* ── Verified ────────────────────────────────────────────── */}
      <AttributeCard icon={<ShieldCheck className="h-4 w-4" />} label={t('compare.fields.verified')}>
        {guides.map((g, i) => (
          <TextRow key={g.id} name={getGuideName(g)} accentIdx={i}>
            {g.isVerified ? (
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

      {/* ── Languages ───────────────────────────────────────────── */}
      <AttributeCard icon={<Languages className="h-4 w-4" />} label={t('compare_guides.fields.languages')}>
        {guides.map((g, i) => (
          <TextRow key={g.id} name={getGuideName(g)} accentIdx={i}>
            <span className="text-sm text-foreground">
              {g.languages && g.languages.length > 0
                ? g.languages.join(', ')
                : <Minus className="h-4 w-4 text-muted-foreground inline-block" />}
            </span>
          </TextRow>
        ))}
      </AttributeCard>

      {/* ── Location ────────────────────────────────────────────── */}
      <AttributeCard icon={<MapPin className="h-4 w-4" />} label={t('compare_guides.fields.location')}>
        {guides.map((g, i) => {
          const locationNames = g.locations?.map((loc) => {
            if ('location' in loc && loc.location) return loc.location.name;
            if ('name' in loc) return (loc as { name: string }).name;
            return null;
          }).filter(Boolean) ?? [];
          return (
            <TextRow key={g.id} name={getGuideName(g)} accentIdx={i}>
              <span className="text-sm text-foreground">
                {locationNames.length > 0
                  ? locationNames.join(', ')
                  : <Minus className="h-4 w-4 text-muted-foreground inline-block" />}
              </span>
            </TextRow>
          );
        })}
      </AttributeCard>

      {/* ── Price per Day ───────────────────────────────────────── */}
      <AttributeCard icon={<DollarSign className="h-4 w-4" />} label={t('compare_guides.fields.price_per_day')}>
        {guides.map((g, i) => (
          <TextRow key={g.id} name={getGuideName(g)} accentIdx={i}>
            <span className="text-sm font-medium text-foreground">
              {g.pricePerDay
                ? formatPrice(Number(g.pricePerDay), g.currency || 'GEL')
                : <Minus className="h-4 w-4 text-muted-foreground inline-block" />}
            </span>
          </TextRow>
        ))}
      </AttributeCard>

      {/* ── Member Since ────────────────────────────────────────── */}
      <AttributeCard icon={<Calendar className="h-4 w-4" />} label={t('compare.fields.member_since')}>
        {guides.map((g, i) => (
          <TextRow key={g.id} name={getGuideName(g)} accentIdx={i}>
            <span className="text-sm font-medium text-foreground">
              {new Date(g.createdAt).getFullYear()}
            </span>
          </TextRow>
        ))}
      </AttributeCard>

      {/* ── View Details ────────────────────────────────────────── */}
      <div className="space-y-2 pt-2">
        {guides.map((g, i) => {
          const accent = ACCENTS[i] ?? ACCENTS[0];
          return (
            <Button
              key={g.id}
              variant="outline"
              onClick={() => onViewDetails(g.id)}
              className="w-full rounded-xl h-11 gap-2 justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn('h-2 w-2 rounded-full shrink-0', accent.dot)} />
                <span className="truncate">{getGuideName(g)}</span>
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

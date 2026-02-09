'use client';

import type { ReactNode } from 'react';
import {
  Star, ShieldCheck, MapPin, Calendar,
  MessageSquare, User, ArrowRight, X, Minus,
  Trophy, Car, Users, DollarSign,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Driver } from '@/features/drivers/types/driver.types';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media';
import { useCurrency } from '@/context/CurrencyContext';

// ─── Types ───────────────────────────────────────────────────────────

interface MobileCompareViewProps {
  drivers: Driver[];
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

function getDriverName(driver: Driver): string {
  return driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown Driver';
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

export function MobileCompareView({ drivers, onRemove, onViewDetails, t }: MobileCompareViewProps): ReactNode {
  const { formatPrice } = useCurrency();
  const ratings = drivers.map((d) => (d.averageRating ? Number(d.averageRating) : null));
  const reviewCounts = drivers.map((d) => d.reviewCount ?? 0);
  const maxReviews = Math.max(...reviewCounts, 1);
  const bestRatingIdx = findBestIndex(ratings);
  const bestReviewIdx = findBestIndex(reviewCounts);

  const capacities = drivers.map((d) => d.vehicleCapacity ?? null);
  const bestCapIdx = findBestIndex(capacities);
  const maxCapacity = Math.max(...capacities.filter((v): v is number => v !== null), 1);

  return (
    <div className="space-y-3">
      {/* ── Driver Headers ─────────────────────────────────────── */}
      <div className="space-y-2">
        {drivers.map((driver, i) => {
          const photoUrl = driver.avatarUrl
            ? getMediaUrl(driver.avatarUrl)
            : driver.photoUrl
              ? getMediaUrl(driver.photoUrl)
              : null;
          const accent = ACCENTS[i] ?? ACCENTS[0];
          const name = getDriverName(driver);
          return (
            <div
              key={driver.id}
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
                onClick={() => onRemove(driver.id)}
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
        {drivers.map((d, i) => {
          const rating = ratings[i];
          return (
            <BarRow
              key={d.id}
              name={getDriverName(d)}
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
        {drivers.map((d, i) => (
          <BarRow
            key={d.id}
            name={getDriverName(d)}
            displayValue={String(reviewCounts[i])}
            percentage={(reviewCounts[i] / maxReviews) * 100}
            accentIdx={i}
            isBest={i === bestReviewIdx}
          />
        ))}
      </AttributeCard>

      {/* ── Vehicle ────────────────────────────────────────────── */}
      <AttributeCard icon={<Car className="h-4 w-4" />} label={t('compare_drivers.fields.vehicle')}>
        {drivers.map((d, i) => (
          <TextRow key={d.id} name={getDriverName(d)} accentIdx={i}>
            <span className="text-sm text-foreground">
              {[d.vehicleMake, d.vehicleModel, d.vehicleYear ? `(${d.vehicleYear})` : null].filter(Boolean).join(' ') || <Minus className="h-4 w-4 text-muted-foreground inline-block" />}
            </span>
          </TextRow>
        ))}
      </AttributeCard>

      {/* ── Capacity ──────────────────────────────────────────── */}
      <AttributeCard icon={<Users className="h-4 w-4" />} label={t('compare_drivers.fields.capacity')}>
        {drivers.map((d, i) => {
          const cap = capacities[i];
          return (
            <BarRow
              key={d.id}
              name={getDriverName(d)}
              displayValue={cap !== null ? `${cap} ${t('common.seats')}` : '-'}
              percentage={cap !== null ? (cap / maxCapacity) * 100 : 0}
              accentIdx={i}
              isBest={i === bestCapIdx}
            />
          );
        })}
      </AttributeCard>

      {/* ── Verified ────────────────────────────────────────────── */}
      <AttributeCard icon={<ShieldCheck className="h-4 w-4" />} label={t('compare.fields.verified')}>
        {drivers.map((d, i) => (
          <TextRow key={d.id} name={getDriverName(d)} accentIdx={i}>
            {d.isVerified ? (
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

      {/* ── Location ────────────────────────────────────────────── */}
      <AttributeCard icon={<MapPin className="h-4 w-4" />} label={t('compare_drivers.fields.location')}>
        {drivers.map((d, i) => (
          <TextRow key={d.id} name={getDriverName(d)} accentIdx={i}>
            <span className="text-sm text-foreground">
              {d.locations && d.locations.length > 0
                ? d.locations.map((loc) => loc.name).filter(Boolean).join(', ')
                : <Minus className="h-4 w-4 text-muted-foreground inline-block" />}
            </span>
          </TextRow>
        ))}
      </AttributeCard>

      {/* ── Price per Day ───────────────────────────────────────── */}
      <AttributeCard icon={<DollarSign className="h-4 w-4" />} label={t('compare_drivers.fields.price_per_day')}>
        {drivers.map((d, i) => (
          <TextRow key={d.id} name={getDriverName(d)} accentIdx={i}>
            <span className="text-sm font-medium text-foreground">
              {d.pricePerDay
                ? formatPrice(Number(d.pricePerDay), d.currency || 'GEL')
                : <Minus className="h-4 w-4 text-muted-foreground inline-block" />}
            </span>
          </TextRow>
        ))}
      </AttributeCard>

      {/* ── Member Since ────────────────────────────────────────── */}
      <AttributeCard icon={<Calendar className="h-4 w-4" />} label={t('compare.fields.member_since')}>
        {drivers.map((d, i) => (
          <TextRow key={d.id} name={getDriverName(d)} accentIdx={i}>
            <span className="text-sm font-medium text-foreground">
              {new Date(d.createdAt).getFullYear()}
            </span>
          </TextRow>
        ))}
      </AttributeCard>

      {/* ── View Details ────────────────────────────────────────── */}
      <div className="space-y-2 pt-2">
        {drivers.map((d, i) => {
          const accent = ACCENTS[i] ?? ACCENTS[0];
          return (
            <Button
              key={d.id}
              variant="outline"
              onClick={() => onViewDetails(d.id)}
              className="w-full rounded-xl h-11 gap-2 justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn('h-2 w-2 rounded-full shrink-0', accent.dot)} />
                <span className="truncate">{getDriverName(d)}</span>
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

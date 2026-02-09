'use client';

import { useTranslation } from 'react-i18next';
import {
    Eye, MessageSquare, Heart, CalendarCheck, Star,
    TrendingUp, Clock, Sparkles,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { useProviderAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import { formatResponseTime } from '@/lib/utils/format';
import { useAuth } from '@/features/auth/hooks/useAuth';

import type { ProviderAnalytics } from '@/features/analytics/types/analytics.types';

/* ── Helpers ────────────────────────────────── */

function fmtPercent(value: number): string {
    return `${Math.round(value * 100)}%`;
}

function fmtRating(value: number | null): string {
    if (value === null) return '-';
    return value.toFixed(1);
}

/* ── Stat Card ──────────────────────────────── */

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    iconColor,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    iconColor?: string;
}): React.ReactNode {
    return (
        <div className="rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold tabular-nums">{value}</p>
                    {sub && (
                        <p className="text-xs text-muted-foreground">{sub}</p>
                    )}
                </div>
                <div className="p-2 rounded-lg bg-primary/5">
                    <Icon className={cn('h-4 w-4', iconColor ?? 'text-primary')} />
                </div>
            </div>
        </div>
    );
}

/* ── Metric Row ─────────────────────────────── */

function MetricRow({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string | number;
    icon: React.ElementType;
}): React.ReactNode {
    return (
        <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2.5 text-sm">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{label}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">{value}</span>
        </div>
    );
}

/* ── Skeletons ──────────────────────────────── */

function StatCardSkeleton(): React.ReactNode {
    return (
        <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-7 w-12" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
        </div>
    );
}

/* ── Empty State ────────────────────────────── */

function EmptyState(): React.ReactNode {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Sparkles className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold mb-1">
                {t('analytics.empty_title', 'No data yet')}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm text-center">
                {t('analytics.empty_description', 'Analytics will appear here once your listings start receiving views and inquiries.')}
            </p>
        </div>
    );
}

/* ── Analytics Content ──────────────────────── */

function AnalyticsContent({ data }: { data: ProviderAnalytics }): React.ReactNode {
    const { t } = useTranslation();
    const { user } = useAuth();

    // Determine if the provider has any data at all
    const hasData = data.views.total > 0 || data.inquiries.total > 0 ||
        data.favorites.total > 0 || data.bookings.total > 0;

    if (!hasData) return <EmptyState />;

    // Get response time from user profile (if available)
    const avgResponseMinutes = user?.companyProfile?.avgResponseTimeMinutes
        ?? user?.guideProfile?.avgResponseTimeMinutes
        ?? user?.driverProfile?.avgResponseTimeMinutes
        ?? null;
    const responseTimeInfo = formatResponseTime(avgResponseMinutes);

    return (
        <div className="space-y-6">
            {/* Primary stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    icon={Eye}
                    label={t('analytics.views', 'Views')}
                    value={data.views.total}
                    sub={t('analytics.last_30_days', '{{count}} last 30 days', { count: data.views.last30Days })}
                />
                <StatCard
                    icon={MessageSquare}
                    label={t('analytics.inquiries', 'Inquiries')}
                    value={data.inquiries.total}
                    sub={t('analytics.last_30_days', '{{count}} last 30 days', { count: data.inquiries.last30Days })}
                    iconColor="text-info"
                />
                <StatCard
                    icon={Heart}
                    label={t('analytics.favorites', 'Favorites')}
                    value={data.favorites.total}
                    iconColor="text-destructive"
                />
                <StatCard
                    icon={CalendarCheck}
                    label={t('analytics.bookings', 'Bookings')}
                    value={data.bookings.total}
                    sub={t('analytics.last_30_days', '{{count}} last 30 days', { count: data.bookings.last30Days })}
                    iconColor="text-success"
                />
            </div>

            {/* Details panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Performance */}
                <div className="rounded-xl border border-border/50 bg-card p-5">
                    <h3 className="text-sm font-semibold mb-3">
                        {t('analytics.performance', 'Performance')}
                    </h3>
                    <div className="space-y-0">
                        <MetricRow
                            icon={Star}
                            label={t('analytics.avg_rating', 'Average Rating')}
                            value={data.avgRating !== null
                                ? `${fmtRating(data.avgRating)} / 5`
                                : '-'
                            }
                        />
                        <MetricRow
                            icon={Star}
                            label={t('analytics.review_count', 'Reviews')}
                            value={data.reviewCount}
                        />
                        <MetricRow
                            icon={TrendingUp}
                            label={t('analytics.response_rate', 'Response Rate')}
                            value={data.inquiries.total > 0
                                ? fmtPercent(data.inquiries.responseRate)
                                : '-'
                            }
                        />
                        {responseTimeInfo && (
                            <MetricRow
                                icon={Clock}
                                label={t('analytics.response_time', 'Avg Response Time')}
                                value={responseTimeInfo.label}
                            />
                        )}
                    </div>
                </div>

                {/* Engagement */}
                <div className="rounded-xl border border-border/50 bg-card p-5">
                    <h3 className="text-sm font-semibold mb-3">
                        {t('analytics.engagement', 'Engagement')}
                    </h3>
                    <div className="space-y-0">
                        <MetricRow
                            icon={Eye}
                            label={t('analytics.views_30d', 'Views (30 days)')}
                            value={data.views.last30Days}
                        />
                        <MetricRow
                            icon={MessageSquare}
                            label={t('analytics.inquiries_30d', 'Inquiries (30 days)')}
                            value={data.inquiries.last30Days}
                        />
                        <MetricRow
                            icon={CalendarCheck}
                            label={t('analytics.bookings_30d', 'Bookings (30 days)')}
                            value={data.bookings.last30Days}
                        />
                        <MetricRow
                            icon={Heart}
                            label={t('analytics.total_favorites', 'Total Favorites')}
                            value={data.favorites.total}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Page ───────────────────────────────────── */

export default function AnalyticsPage(): React.ReactNode {
    const { t } = useTranslation();
    const { data, isLoading, isError } = useProviderAnalytics();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    {t('analytics.title', 'Analytics')}
                </h1>
                <p className="text-muted-foreground">
                    {t('analytics.description', 'Track your performance, inquiries, and engagement.')}
                </p>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <StatCardSkeleton key={i} />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-56 rounded-xl" />
                        <Skeleton className="h-56 rounded-xl" />
                    </div>
                </div>
            ) : isError ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
                    <p className="text-sm text-destructive">
                        {t('common.error_loading', 'Failed to load data. Please try again.')}
                    </p>
                </div>
            ) : data ? (
                <AnalyticsContent data={data} />
            ) : (
                <EmptyState />
            )}
        </div>
    );
}

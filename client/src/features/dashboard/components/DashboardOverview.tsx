'use client';

import { useTranslation } from 'react-i18next';
import {
    CalendarCheck,
    Star,
    Heart,
    MessageSquare,
    Eye,
    TrendingUp,
    Zap,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProviderAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { useBookings } from '@/features/bookings/hooks/useBookings';
import { useFavorites } from '@/features/favorites/hooks/useFavorites';
import { useSentInquiries } from '@/features/inquiries/hooks/useInquiries';
import { useMyReviews } from '@/features/reviews/hooks/useReviews';
import { ROUTES } from '@/lib/constants/routes';
import { StatCard } from './StatCard';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';

import type { UserRole } from '@/features/auth/types/auth.types';

function getGreeting(name: string): string {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
}

export const DashboardOverview = (): React.ReactNode => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const userRoles = (user?.roles ?? []) as UserRole[];

    const { data: bookingsData, isLoading: bookingsLoading } = useBookings({ limit: 1 });
    const { data: favoritesData, isLoading: favoritesLoading } = useFavorites({ limit: 1 });
    const { data: inquiriesData, isLoading: inquiriesLoading } = useSentInquiries({ limit: 1 });
    const { data: reviewsData, isLoading: reviewsLoading } = useMyReviews({ limit: 1 });

    const bookingsCount = bookingsData?.pagination?.totalItems ?? 0;
    const favoritesCount = favoritesData?.pagination?.totalItems ?? 0;
    const inquiriesCount = inquiriesData?.pagination?.totalItems ?? 0;
    const reviewsCount = reviewsData?.pagination?.totalItems ?? 0;

    const isProvider = userRoles.some((r) => ['COMPANY', 'GUIDE', 'DRIVER'].includes(r));

    const { data: analyticsData, isLoading: analyticsLoading } = useProviderAnalytics();

    const greeting = getGreeting(user?.firstName || 'there');

    return (
        <div className="space-y-8">
            {/* Greeting */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
                <p className="text-muted-foreground mt-1">
                    {t('dashboard.overview.subtitle', "Here's what's happening with your account.")}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={CalendarCheck}
                    label={t('dashboard.overview.stats.bookings', 'Bookings')}
                    value={bookingsCount}
                    href={ROUTES.BOOKINGS.ROOT}
                    color="bg-primary/10 text-primary"
                    isLoading={bookingsLoading}
                />
                <StatCard
                    icon={Heart}
                    label={t('dashboard.overview.stats.favorites', 'Favorites')}
                    value={favoritesCount}
                    href={ROUTES.FAVORITES}
                    color="bg-destructive/10 text-destructive"
                    isLoading={favoritesLoading}
                />
                <StatCard
                    icon={MessageSquare}
                    label={t('dashboard.overview.stats.inquiries', 'Inquiries')}
                    value={inquiriesCount}
                    href={ROUTES.INQUIRIES.ROOT}
                    color="bg-info/10 text-info"
                    isLoading={inquiriesLoading}
                />
                <StatCard
                    icon={Star}
                    label={t('dashboard.overview.stats.reviews', 'Reviews')}
                    value={reviewsCount}
                    href={ROUTES.REVIEWS}
                    color="bg-warning/10 text-warning"
                    isLoading={reviewsLoading}
                />
            </div>

            {isProvider && <Separator />}

            {/* Provider Stats (optional) */}
            {isProvider && (
                <div className="grid grid-cols-3 gap-4">
                    <StatCard
                        icon={Eye}
                        label={t('dashboard.overview.stats.views', 'Views')}
                        value={analyticsData?.views.total ?? 0}
                        href={ROUTES.ANALYTICS}
                        color="bg-success/10 text-success"
                        isLoading={analyticsLoading}
                        description={t('dashboard.overview.stats.views_30d', 'Last 30 days: {{count}}', { count: analyticsData?.views.last30Days ?? 0 })}
                    />
                    <StatCard
                        icon={Zap}
                        label={t('dashboard.overview.stats.response_rate', 'Response Rate')}
                        value={analyticsData?.inquiries.responseRate != null ? `${Math.round(analyticsData.inquiries.responseRate * 100)}%` : '0%'}
                        href={ROUTES.ANALYTICS}
                        color="bg-info/10 text-info"
                        isLoading={analyticsLoading}
                    />
                    <StatCard
                        icon={TrendingUp}
                        label={t('dashboard.overview.stats.avg_rating', 'Avg Rating')}
                        value={analyticsData?.avgRating != null ? analyticsData.avgRating.toFixed(1) : '-'}
                        href={ROUTES.ANALYTICS}
                        color="bg-warning/10 text-warning"
                        isLoading={analyticsLoading}
                        description={analyticsData?.reviewCount ? t('dashboard.overview.stats.review_count', '{{count}} reviews', { count: analyticsData.reviewCount }) : undefined}
                    />
                </div>
            )}

            {/* Quick Actions + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <QuickActions />
                <RecentActivity />
            </div>
        </div>
    );
};

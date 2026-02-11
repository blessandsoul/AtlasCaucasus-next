'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
    CalendarCheck,
    CheckCircle2,
    Clock,
    XCircle,
    Compass,
    Globe,
    Car,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookings } from '@/features/bookings/hooks/useBookings';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

import type { BookingStatus, BookingEntityType } from '@/features/bookings/types/booking.types';

function timeAgo(dateStr: string): string {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

function getEntityIcon(entityType: BookingEntityType): React.ElementType {
    switch (entityType) {
        case 'TOUR': return Compass;
        case 'GUIDE': return Globe;
        case 'DRIVER': return Car;
        default: return Compass;
    }
}

function getStatusConfig(status: BookingStatus): { icon: React.ElementType; color: string; label: string } {
    switch (status) {
        case 'PENDING':
            return { icon: Clock, color: 'bg-warning/10 text-warning border-warning/20', label: 'Pending' };
        case 'CONFIRMED':
            return { icon: CalendarCheck, color: 'bg-primary/10 text-primary border-primary/20', label: 'Confirmed' };
        case 'COMPLETED':
            return { icon: CheckCircle2, color: 'bg-success/10 text-success border-success/20', label: 'Completed' };
        case 'CANCELLED':
            return { icon: XCircle, color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Cancelled' };
        case 'DECLINED':
            return { icon: XCircle, color: 'bg-muted text-muted-foreground border-border', label: 'Declined' };
    }
}

export const RecentActivity = (): React.ReactNode => {
    const { t } = useTranslation();
    const { data, isLoading } = useBookings({ limit: 5 });
    const bookings = data?.items ?? [];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                    {t('dashboard.overview.recent_activity', 'Recent Activity')}
                </h2>
                <Link
                    href={ROUTES.BOOKINGS.ROOT}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    {t('dashboard.overview.view_all', 'View all')}
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                {isLoading ? (
                    <div className="divide-y divide-border/30">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3">
                                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4">
                        <div className="p-3 rounded-full bg-muted/50 mb-3">
                            <Sparkles className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            {t('dashboard.overview.no_activity', 'No recent activity')}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                            {t('dashboard.overview.no_activity_desc', 'Your recent bookings will appear here')}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        {bookings.map((booking) => {
                            const EntityIcon = getEntityIcon(booking.entityType as BookingEntityType);
                            const statusConfig = getStatusConfig(booking.status);
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div
                                    key={booking.id}
                                    className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="p-1.5 rounded-lg bg-primary/5 shrink-0">
                                        <EntityIcon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {booking.entityType.charAt(0) + booking.entityType.slice(1).toLowerCase()} Booking
                                        </p>
                                        <p className="text-xs text-muted-foreground">{timeAgo(booking.createdAt)}</p>
                                    </div>
                                    <Badge variant="outline" className={cn('gap-1 text-[10px] font-medium', statusConfig.color)}>
                                        <StatusIcon className="h-2.5 w-2.5" />
                                        {statusConfig.label}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

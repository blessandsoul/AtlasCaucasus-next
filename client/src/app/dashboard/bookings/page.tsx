'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
    CalendarCheck, Clock, Users, XCircle, CheckCircle2,
    Globe, Car, Compass, Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AddToCalendar } from '@/components/common/AddToCalendar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { useBookings, useCancelBooking } from '@/features/bookings/hooks/useBookings';
import { cn } from '@/lib/utils';

import type { BookingStatus, BookingEntityType, Booking } from '@/features/bookings/types/booking.types';

type TabValue = 'ALL' | BookingStatus;

/* ── Helpers ────────────────────────────────── */

function fmtDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(dateStr));
}

function fmtPrice(price: string | number | null, currency = 'GEL'): string {
    if (price == null) return '-';
    const sym: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€' };
    return `${sym[currency] ?? currency} ${Number(price)}`;
}

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

function getStatusConfig(status: BookingStatus): {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ElementType;
    className: string;
} {
    switch (status) {
        case 'CONFIRMED':
            return {
                label: 'Confirmed',
                variant: 'default',
                icon: CalendarCheck,
                className: 'bg-primary/10 text-primary border-primary/20',
            };
        case 'COMPLETED':
            return {
                label: 'Completed',
                variant: 'secondary',
                icon: CheckCircle2,
                className: 'bg-success/10 text-success border-success/20',
            };
        case 'CANCELLED':
            return {
                label: 'Cancelled',
                variant: 'destructive',
                icon: XCircle,
                className: 'bg-destructive/10 text-destructive border-destructive/20',
            };
    }
}

/* ── Status Badge ──────────────────────────── */

function StatusBadge({ status }: { status: BookingStatus }): React.ReactNode {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
        <Badge variant="outline" className={cn('gap-1 font-medium', config.className)}>
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
}

/* ── Booking Card ──────────────────────────── */

function BookingCard({
    booking,
    onCancel,
    isCancelling,
}: {
    booking: Booking;
    onCancel: (id: string) => void;
    isCancelling: boolean;
}): React.ReactNode {
    const { t } = useTranslation();
    const EntityIcon = getEntityIcon(booking.entityType as BookingEntityType);

    return (
        <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-200 hover:shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Icon */}
                <div className="p-2.5 rounded-xl bg-primary/5 shrink-0 self-start">
                    <EntityIcon className="h-5 w-5 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold truncate">
                                {booking.entityType.charAt(0) + booking.entityType.slice(1).toLowerCase()} Booking
                            </h3>
                            <StatusBadge status={booking.status} />
                        </div>
                    </div>

                    {/* Details row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {timeAgo(booking.createdAt)}
                        </span>

                        {booking.date && (
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarCheck className="h-3.5 w-3.5" />
                                {fmtDate(booking.date)}
                            </span>
                        )}

                        {booking.guests && (
                            <span className="inline-flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
                            </span>
                        )}

                        {booking.totalPrice && (
                            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                {fmtPrice(booking.totalPrice, booking.currency)}
                            </span>
                        )}
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{booking.notes}</p>
                    )}
                </div>

                {/* Actions */}
                {(booking.status === 'CONFIRMED' || (booking.status === 'COMPLETED' && booking.date)) && (
                    <div className="shrink-0 self-start flex flex-col gap-2">
                        {booking.date && (
                            <AddToCalendar
                                event={{
                                    title: `${booking.entityType.charAt(0) + booking.entityType.slice(1).toLowerCase()} Booking`,
                                    date: booking.date,
                                    description: [
                                        booking.notes,
                                        booking.guests ? `Guests: ${booking.guests}` : null,
                                        booking.totalPrice ? `Total: ${fmtPrice(booking.totalPrice, booking.currency)}` : null,
                                    ].filter(Boolean).join('\n'),
                                }}
                            />
                        )}

                        {booking.status === 'CONFIRMED' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
                                        disabled={isCancelling}
                                    >
                                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                        {t('bookings.cancel', 'Cancel')}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t('bookings.cancel_confirm_title', 'Cancel booking?')}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {t('bookings.cancel_confirm_description', 'This action cannot be undone. The provider will be notified about the cancellation.')}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t('common.go_back', 'Go back')}</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onCancel(booking.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            {t('bookings.cancel_confirm', 'Yes, cancel booking')}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Skeletons ─────────────────────────────── */

function BookingCardSkeleton(): React.ReactNode {
    return (
        <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
            </div>
        </div>
    );
}

/* ── Empty State ───────────────────────────── */

function EmptyState({ tab }: { tab: TabValue }): React.ReactNode {
    const { t } = useTranslation();

    const messages: Record<TabValue, { title: string; description: string }> = {
        ALL: {
            title: t('bookings.empty_title', 'No bookings yet'),
            description: t('bookings.empty_description', 'When a provider accepts your inquiry, a booking will be created automatically.'),
        },
        CONFIRMED: {
            title: t('bookings.empty_confirmed', 'No upcoming bookings'),
            description: t('bookings.empty_confirmed_desc', 'Your confirmed bookings will appear here.'),
        },
        COMPLETED: {
            title: t('bookings.empty_completed', 'No completed bookings'),
            description: t('bookings.empty_completed_desc', 'Bookings marked as completed will show here.'),
        },
        CANCELLED: {
            title: t('bookings.empty_cancelled', 'No cancelled bookings'),
            description: t('bookings.empty_cancelled_desc', 'Any cancelled bookings will appear here.'),
        },
    };

    const msg = messages[tab];

    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Sparkles className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{msg.title}</h3>
            <p className="text-muted-foreground text-sm max-w-sm text-center mb-6">
                {msg.description}
            </p>
            <Link href="/explore/tours">
                <Button variant="outline" size="sm">
                    <Compass className="mr-2 h-4 w-4" />
                    {t('bookings.browse_tours', 'Browse Tours')}
                </Button>
            </Link>
        </div>
    );
}

/* ── Tabs ───────────────────────────────────── */

const TABS: { value: TabValue; labelKey: string; fallback: string }[] = [
    { value: 'ALL', labelKey: 'bookings.tabs.all', fallback: 'All' },
    { value: 'CONFIRMED', labelKey: 'bookings.tabs.confirmed', fallback: 'Upcoming' },
    { value: 'COMPLETED', labelKey: 'bookings.tabs.completed', fallback: 'Completed' },
    { value: 'CANCELLED', labelKey: 'bookings.tabs.cancelled', fallback: 'Cancelled' },
];

/* ── Page ───────────────────────────────────── */

export default function BookingsPage(): React.ReactNode {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabValue>('ALL');

    const statusFilter = activeTab === 'ALL' ? undefined : activeTab;
    const { data, isLoading } = useBookings({
        status: statusFilter,
        limit: 20,
    });

    const cancelMutation = useCancelBooking();

    const handleCancel = useCallback((bookingId: string): void => {
        cancelMutation.mutate(bookingId);
    }, [cancelMutation]);

    const bookings = data?.items ?? [];
    const totalItems = data?.pagination.totalItems ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    {t('bookings.title', 'My Bookings')}
                </h1>
                <p className="text-muted-foreground">
                    {t('bookings.description', 'Track and manage your confirmed bookings.')}
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
                {([
                    { status: 'CONFIRMED' as const, icon: CalendarCheck, label: t('bookings.tabs.confirmed', 'Upcoming'), color: 'text-primary' },
                    { status: 'COMPLETED' as const, icon: CheckCircle2, label: t('bookings.tabs.completed', 'Completed'), color: 'text-success' },
                    { status: 'CANCELLED' as const, icon: XCircle, label: t('bookings.tabs.cancelled', 'Cancelled'), color: 'text-destructive' },
                ]).map(({ status, icon: Icon, label, color }) => (
                    <button
                        key={status}
                        onClick={() => setActiveTab(status)}
                        className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left',
                            activeTab === status
                                ? 'border-primary/30 bg-primary/5 shadow-sm'
                                : 'border-border/50 bg-card hover:border-border hover:shadow-sm',
                        )}
                    >
                        <div className={cn('p-2 rounded-lg', activeTab === status ? 'bg-primary/10' : 'bg-muted/50')}>
                            <Icon className={cn('h-4 w-4', activeTab === status ? 'text-primary' : color)} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border pb-px overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={cn(
                            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap',
                            activeTab === tab.value
                                ? 'bg-primary/10 text-primary border-b-2 border-primary -mb-px'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                        )}
                    >
                        {t(tab.labelKey, tab.fallback)}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-3">
                    <BookingCardSkeleton />
                    <BookingCardSkeleton />
                    <BookingCardSkeleton />
                </div>
            ) : bookings.length === 0 ? (
                <EmptyState tab={activeTab} />
            ) : (
                <div className="space-y-3">
                    {bookings.map(booking => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            onCancel={handleCancel}
                            isCancelling={cancelMutation.isPending}
                        />
                    ))}
                    {totalItems > bookings.length && (
                        <p className="text-center text-sm text-muted-foreground pt-4">
                            {t('bookings.showing', 'Showing {{count}} of {{total}} bookings', {
                                count: bookings.length,
                                total: totalItems,
                            })}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

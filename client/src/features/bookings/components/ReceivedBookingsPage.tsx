'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    CalendarCheck, Clock, Users, XCircle, CheckCircle2,
    Globe, Car, Compass, Sparkles, Mail, Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { ConfirmBookingDialog } from './ConfirmBookingDialog';
import { DeclineBookingDialog } from './DeclineBookingDialog';
import {
    useReceivedBookings,
    useConfirmBooking,
    useDeclineBooking,
    useCompleteBooking,
} from '@/features/bookings/hooks/useBookings';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media';

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
    icon: React.ElementType;
    className: string;
} {
    switch (status) {
        case 'PENDING':
            return {
                label: 'Pending',
                icon: Clock,
                className: 'bg-warning/10 text-warning border-warning/20',
            };
        case 'CONFIRMED':
            return {
                label: 'Confirmed',
                icon: CalendarCheck,
                className: 'bg-primary/10 text-primary border-primary/20',
            };
        case 'COMPLETED':
            return {
                label: 'Completed',
                icon: CheckCircle2,
                className: 'bg-success/10 text-success border-success/20',
            };
        case 'CANCELLED':
            return {
                label: 'Cancelled',
                icon: XCircle,
                className: 'bg-destructive/10 text-destructive border-destructive/20',
            };
        case 'DECLINED':
            return {
                label: 'Declined',
                icon: XCircle,
                className: 'bg-muted text-muted-foreground border-border',
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

/* ── Received Booking Card ─────────────────── */

function ReceivedBookingCard({
    booking,
    onConfirmClick,
    onDeclineClick,
    onCompleteClick,
}: {
    booking: Booking;
    onConfirmClick: (booking: Booking) => void;
    onDeclineClick: (booking: Booking) => void;
    onCompleteClick: (booking: Booking) => void;
}): React.ReactNode {
    const { t } = useTranslation();
    const router = useRouter();
    const EntityIcon = getEntityIcon(booking.entityType as BookingEntityType);
    const customerName = booking.user
        ? `${booking.user.firstName} ${booking.user.lastName}`
        : '-';

    const handleCardClick = useCallback((): void => {
        router.push(ROUTES.BOOKINGS.DETAIL(booking.id));
    }, [router, booking.id]);

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleCardClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
            className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Entity image or icon */}
                {booking.entityImage ? (
                    <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 self-start">
                        <img
                            src={getMediaUrl(booking.entityImage)}
                            alt={booking.entityName ?? ''}
                            className="h-full w-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="p-2.5 rounded-xl bg-primary/5 shrink-0 self-start">
                        <EntityIcon className="h-5 w-5 text-primary" />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold truncate text-base">
                                {booking.entityName ?? `${booking.entityType.charAt(0) + booking.entityType.slice(1).toLowerCase()} Booking`}
                            </h3>
                            <StatusBadge status={booking.status} />
                        </div>
                    </div>

                    {/* Reference number */}
                    {booking.referenceNumber && (
                        <p className="text-xs text-muted-foreground font-mono">
                            {booking.referenceNumber}
                        </p>
                    )}

                    {/* Customer info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {customerName}
                        </span>
                        {booking.user?.email && (
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" />
                                {booking.user.email}
                            </span>
                        )}
                    </div>

                    {/* Booking details row */}
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
                            <span className="inline-flex items-center gap-1.5 font-bold text-foreground text-lg">
                                {fmtPrice(booking.totalPrice, booking.currency)}
                            </span>
                        )}
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2 italic">
                            &ldquo;{booking.notes}&rdquo;
                        </p>
                    )}
                </div>

                {/* Action buttons */}
                <div
                    className="shrink-0 self-start flex flex-col gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    {booking.status === 'PENDING' && (
                        <>
                            <Button
                                size="sm"
                                className="bg-success text-success-foreground hover:bg-success/90 h-12 px-4"
                                onClick={() => onConfirmClick(booking)}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                {t('bookings.confirm', 'Confirm')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20 h-12"
                                onClick={() => onDeclineClick(booking)}
                            >
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                {t('bookings.decline', 'Decline')}
                            </Button>
                        </>
                    )}

                    {booking.status === 'CONFIRMED' && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-12"
                            onClick={() => onCompleteClick(booking)}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                            {t('bookings.mark_complete', 'Mark Complete')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Skeletons ─────────────────────────────── */

function BookingCardSkeleton(): React.ReactNode {
    return (
        <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-32" />
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-36" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-24 rounded-md" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                </div>
            </div>
        </div>
    );
}

/* ── Empty State ───────────────────────────── */

function EmptyState({ tab }: { tab: TabValue }): React.ReactNode {
    const { t } = useTranslation();

    const messages: Record<TabValue, { title: string; description: string }> = {
        ALL: {
            title: t('bookings.received_empty_title', 'No bookings received'),
            description: t('bookings.received_empty_description', 'When customers book your tours or services, they will appear here.'),
        },
        PENDING: {
            title: t('bookings.received_empty_pending', 'No pending bookings'),
            description: t('bookings.received_empty_pending_desc', 'Your new booking requests will appear here.'),
        },
        CONFIRMED: {
            title: t('bookings.received_empty_confirmed', 'No confirmed bookings'),
            description: t('bookings.received_empty_confirmed_desc', 'Bookings you\'ve confirmed will appear here.'),
        },
        COMPLETED: {
            title: t('bookings.received_empty_completed', 'No completed bookings'),
            description: t('bookings.received_empty_completed_desc', 'Bookings you\'ve marked as complete will appear here.'),
        },
        CANCELLED: {
            title: t('bookings.received_empty_cancelled', 'No cancelled bookings'),
            description: t('bookings.received_empty_cancelled_desc', 'Bookings cancelled by customers will appear here.'),
        },
        DECLINED: {
            title: t('bookings.received_empty_declined', 'No declined bookings'),
            description: t('bookings.received_empty_declined_desc', 'Bookings you\'ve declined will appear here.'),
        },
    };

    const msg = messages[tab];

    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Sparkles className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{msg.title}</h3>
            <p className="text-muted-foreground text-base max-w-sm text-center">
                {msg.description}
            </p>
        </div>
    );
}

/* ── Tabs ───────────────────────────────────── */

const TABS: { value: TabValue; labelKey: string; fallback: string }[] = [
    { value: 'ALL', labelKey: 'bookings.tabs.all', fallback: 'All' },
    { value: 'PENDING', labelKey: 'bookings.tabs.pending', fallback: 'Pending' },
    { value: 'CONFIRMED', labelKey: 'bookings.tabs.confirmed', fallback: 'Confirmed' },
    { value: 'COMPLETED', labelKey: 'bookings.tabs.completed', fallback: 'Completed' },
    { value: 'DECLINED', labelKey: 'bookings.tabs.declined', fallback: 'Declined' },
    { value: 'CANCELLED', labelKey: 'bookings.tabs.cancelled', fallback: 'Cancelled' },
];

/* ── Tab validation ─────────────────────────── */

const VALID_TABS: TabValue[] = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'DECLINED', 'CANCELLED'];

function isValidTab(value: string | null): value is TabValue {
    return value !== null && VALID_TABS.includes(value as TabValue);
}

/* ── Page Component ────────────────────────── */

export function ReceivedBookingsPage(): React.ReactNode {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();

    const tabParam = searchParams.get('tab');
    const activeTab: TabValue = isValidTab(tabParam) ? tabParam : 'ALL';

    const setActiveTab = useCallback((tab: TabValue): void => {
        const params = new URLSearchParams(searchParams.toString());
        if (tab === 'ALL') {
            params.delete('tab');
        } else {
            params.set('tab', tab);
        }
        const qs = params.toString();
        router.replace(`/dashboard/bookings/received${qs ? `?${qs}` : ''}`, { scroll: false });
    }, [router, searchParams]);

    // Dialog states
    const [confirmDialog, setConfirmDialog] = useState<Booking | null>(null);
    const [declineDialog, setDeclineDialog] = useState<Booking | null>(null);
    const [completeDialog, setCompleteDialog] = useState<Booking | null>(null);

    // Data
    const statusFilter = activeTab === 'ALL' ? undefined : activeTab;
    const { data, isLoading } = useReceivedBookings({
        status: statusFilter,
        limit: 20,
    });

    // Mutations
    const confirmMutation = useConfirmBooking();
    const declineMutation = useDeclineBooking();
    const completeMutation = useCompleteBooking();

    const bookings = data?.items ?? [];
    const totalItems = data?.pagination.totalItems ?? 0;

    // Handlers
    const handleConfirm = useCallback((providerNotes?: string): void => {
        if (!confirmDialog) return;
        confirmMutation.mutate(
            { bookingId: confirmDialog.id, data: { providerNotes } },
            { onSuccess: () => setConfirmDialog(null) },
        );
    }, [confirmDialog, confirmMutation]);

    const handleDecline = useCallback((reason: string): void => {
        if (!declineDialog) return;
        declineMutation.mutate(
            { bookingId: declineDialog.id, data: { declinedReason: reason } },
            { onSuccess: () => setDeclineDialog(null) },
        );
    }, [declineDialog, declineMutation]);

    const handleComplete = useCallback((): void => {
        if (!completeDialog) return;
        completeMutation.mutate(
            completeDialog.id,
            { onSuccess: () => setCompleteDialog(null) },
        );
    }, [completeDialog, completeMutation]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    {t('bookings.received_title', 'Received Bookings')}
                </h1>
                <p className="text-muted-foreground">
                    {t('bookings.received_description', 'Manage booking requests from your customers.')}
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
                {([
                    { status: 'PENDING' as const, icon: Clock, label: t('bookings.tabs.pending', 'Pending'), color: 'text-warning' },
                    { status: 'CONFIRMED' as const, icon: CalendarCheck, label: t('bookings.tabs.confirmed', 'Confirmed'), color: 'text-primary' },
                    { status: 'COMPLETED' as const, icon: CheckCircle2, label: t('bookings.tabs.completed', 'Completed'), color: 'text-success' },
                ]).map(({ status, icon: Icon, label, color }) => (
                    <button
                        key={status}
                        onClick={() => setActiveTab(status)}
                        className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left min-h-[44px]',
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
            <div
                role="tablist"
                aria-label="Filter by status"
                className="flex gap-1 border-b border-border pb-px overflow-x-auto"
            >
                {TABS.map(tab => (
                    <button
                        key={tab.value}
                        role="tab"
                        aria-selected={activeTab === tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={cn(
                            'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap',
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
            <div role="tabpanel">
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
                            <ReceivedBookingCard
                                key={booking.id}
                                booking={booking}
                                onConfirmClick={setConfirmDialog}
                                onDeclineClick={setDeclineDialog}
                                onCompleteClick={setCompleteDialog}
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

            {/* Confirm Booking Dialog */}
            {confirmDialog && (
                <ConfirmBookingDialog
                    open={!!confirmDialog}
                    onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}
                    onConfirm={handleConfirm}
                    isPending={confirmMutation.isPending}
                    entityName={confirmDialog.entityName}
                    customerName={
                        confirmDialog.user
                            ? `${confirmDialog.user.firstName} ${confirmDialog.user.lastName}`
                            : 'Customer'
                    }
                />
            )}

            {/* Decline Booking Dialog */}
            {declineDialog && (
                <DeclineBookingDialog
                    open={!!declineDialog}
                    onOpenChange={(open) => { if (!open) setDeclineDialog(null); }}
                    onDecline={handleDecline}
                    isPending={declineMutation.isPending}
                    entityName={declineDialog.entityName}
                    customerName={
                        declineDialog.user
                            ? `${declineDialog.user.firstName} ${declineDialog.user.lastName}`
                            : 'Customer'
                    }
                />
            )}

            {/* Complete Booking Confirmation */}
            <AlertDialog
                open={!!completeDialog}
                onOpenChange={(open) => { if (!open) setCompleteDialog(null); }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('bookings.complete_confirm_title', 'Mark booking as complete?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'bookings.complete_confirm_description',
                                'This will mark the booking as completed. The customer will be notified.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={completeMutation.isPending}>
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleComplete}
                            disabled={completeMutation.isPending}
                            className="bg-success text-success-foreground hover:bg-success/90"
                        >
                            {completeMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t('bookings.complete_action', 'Mark Complete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

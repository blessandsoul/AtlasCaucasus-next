'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
    ArrowLeft, CalendarCheck, Clock, Users, XCircle, CheckCircle2,
    Globe, Car, Compass, User, Mail, Phone, FileText, Loader2,
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

import { BookingStatusTimeline } from './BookingStatusTimeline';
import { ConfirmBookingDialog } from './ConfirmBookingDialog';
import { DeclineBookingDialog } from './DeclineBookingDialog';
import {
    useBooking,
    useCancelBooking,
    useConfirmBooking,
    useDeclineBooking,
    useCompleteBooking,
} from '@/features/bookings/hooks/useBookings';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media';

import type { BookingStatus, BookingEntityType } from '@/features/bookings/types/booking.types';

/* ── Helpers ────────────────────────────────── */

function fmtDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(dateStr));
}

function fmtShortDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(dateStr));
}

function fmtPrice(price: string | number | null, currency = 'GEL'): string {
    if (price == null) return '-';
    const sym: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€' };
    return `${sym[currency] ?? currency} ${Number(price)}`;
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
            return { label: 'Pending', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' };
        case 'CONFIRMED':
            return { label: 'Confirmed', icon: CalendarCheck, className: 'bg-primary/10 text-primary border-primary/20' };
        case 'COMPLETED':
            return { label: 'Completed', icon: CheckCircle2, className: 'bg-success/10 text-success border-success/20' };
        case 'CANCELLED':
            return { label: 'Cancelled', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' };
        case 'DECLINED':
            return { label: 'Declined', icon: XCircle, className: 'bg-muted text-muted-foreground border-border' };
    }
}

function getEntityPath(entityType: BookingEntityType, entityId: string): string {
    switch (entityType) {
        case 'TOUR': return `/explore/tours/${entityId}`;
        case 'GUIDE': return `/explore/guides/${entityId}`;
        case 'DRIVER': return `/explore/drivers/${entityId}`;
        default: return '#';
    }
}

/* ── Skeleton ──────────────────────────────── */

function DetailSkeleton(): React.ReactNode {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-48" />
            </div>
            <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="rounded-xl border p-6 space-y-4">
                <div className="flex gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-0.5 flex-1 mt-4" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-0.5 flex-1 mt-4" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
            </div>
        </div>
    );
}

/* ── Page Component ────────────────────────── */

export function BookingDetailPage(): React.ReactNode {
    const { t } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const bookingId = params.id as string;

    const { data: booking, isLoading } = useBooking(bookingId);

    // Dialogs
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [declineOpen, setDeclineOpen] = useState(false);
    const [completeOpen, setCompleteOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    // Mutations
    const confirmMutation = useConfirmBooking();
    const declineMutation = useDeclineBooking();
    const completeMutation = useCompleteBooking();
    const cancelMutation = useCancelBooking();

    const isProvider = booking?.providerUserId === user?.id;
    const isCustomer = booking?.userId === user?.id;

    const handleConfirm = useCallback((providerNotes?: string): void => {
        if (!booking) return;
        confirmMutation.mutate(
            { bookingId: booking.id, data: { providerNotes } },
            { onSuccess: () => setConfirmOpen(false) },
        );
    }, [booking, confirmMutation]);

    const handleDecline = useCallback((reason: string): void => {
        if (!booking) return;
        declineMutation.mutate(
            { bookingId: booking.id, data: { declinedReason: reason } },
            { onSuccess: () => setDeclineOpen(false) },
        );
    }, [booking, declineMutation]);

    const handleComplete = useCallback((): void => {
        if (!booking) return;
        completeMutation.mutate(booking.id, { onSuccess: () => setCompleteOpen(false) });
    }, [booking, completeMutation]);

    const handleCancel = useCallback((): void => {
        if (!booking) return;
        cancelMutation.mutate(booking.id, { onSuccess: () => setCancelOpen(false) });
    }, [booking, cancelMutation]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" size="sm" className="pl-0" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common.back', 'Back')}
                </Button>
                <DetailSkeleton />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <h2 className="text-xl font-bold">{t('bookings.not_found', 'Booking not found')}</h2>
                <Button variant="outline" onClick={() => router.push(ROUTES.BOOKINGS.ROOT)}>
                    {t('bookings.go_to_bookings', 'Go to Bookings')}
                </Button>
            </div>
        );
    }

    const statusConfig = getStatusConfig(booking.status);
    const StatusIcon = statusConfig.icon;
    const EntityIcon = getEntityIcon(booking.entityType as BookingEntityType);
    const entityLabel = booking.entityName
        ?? `${booking.entityType.charAt(0) + booking.entityType.slice(1).toLowerCase()} Booking`;
    const customerName = booking.user
        ? `${booking.user.firstName} ${booking.user.lastName}`
        : 'Customer';

    return (
        <div className="space-y-6">
            {/* Back button */}
            <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent hover:text-primary" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back', 'Back')}
            </Button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                    {booking.referenceNumber && (
                        <p className="text-base text-muted-foreground font-mono mb-1">
                            {booking.referenceNumber}
                        </p>
                    )}
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight truncate">
                            {entityLabel}
                        </h1>
                        <Badge role="status" variant="outline" className={cn('gap-1 font-medium shrink-0', statusConfig.className)}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusConfig.label}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Status Timeline */}
            <div className="rounded-xl border border-border/50 bg-card p-6">
                <BookingStatusTimeline
                    status={booking.status}
                    createdAt={booking.createdAt}
                    confirmedAt={booking.confirmedAt}
                    completedAt={booking.completedAt}
                    cancelledAt={booking.cancelledAt}
                    declinedAt={booking.declinedAt}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Entity info card */}
                <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4" aria-label="Service provider information">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <EntityIcon className="h-5 w-5 text-primary" />
                        {booking.entityType.charAt(0) + booking.entityType.slice(1).toLowerCase()} Details
                    </h2>
                    <div className="flex items-start gap-4">
                        {booking.entityImage ? (
                            <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0">
                                <img
                                    src={getMediaUrl(booking.entityImage)}
                                    alt={entityLabel}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-primary/5 shrink-0">
                                <EntityIcon className="h-8 w-8 text-primary" />
                            </div>
                        )}
                        <div className="min-w-0 space-y-1">
                            <p className="font-semibold text-base">{entityLabel}</p>
                            {booking.providerName && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    {booking.providerName}
                                </p>
                            )}
                            <Link
                                href={getEntityPath(booking.entityType as BookingEntityType, booking.entityId)}
                                className="text-sm text-primary hover:underline inline-block mt-1"
                            >
                                {t('bookings.view_listing', 'View listing')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Booking details card */}
                <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4" aria-label="Booking details">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {t('bookings.details', 'Booking Details')}
                    </h2>
                    <div className="space-y-3">
                        {booking.date && (
                            <div className="flex items-center gap-3 text-base">
                                <CalendarCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">{t('bookings.date_label', 'Date')}:</span>
                                <span className="font-medium">{fmtDate(booking.date)}</span>
                            </div>
                        )}
                        {booking.guests && (
                            <div className="flex items-center gap-3 text-base">
                                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">{t('bookings.guests_label', 'Guests')}:</span>
                                <span className="font-medium">{booking.guests}</span>
                            </div>
                        )}
                        {booking.totalPrice && (
                            <div className="flex items-center gap-3 text-base">
                                <span className="h-4 w-4 text-muted-foreground shrink-0 text-center font-bold">$</span>
                                <span className="text-muted-foreground">{t('bookings.total_label', 'Total')}:</span>
                                <span className="font-bold text-xl" aria-live="polite">{fmtPrice(booking.totalPrice, booking.currency)}</span>
                            </div>
                        )}
                        {booking.contactPhone && (
                            <div className="flex items-center gap-3 text-base">
                                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">{t('bookings.phone_label', 'Phone')}:</span>
                                <span className="font-medium">{booking.contactPhone}</span>
                            </div>
                        )}
                        {booking.contactEmail && (
                            <div className="flex items-center gap-3 text-base">
                                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">{t('bookings.email_label', 'Email')}:</span>
                                <span className="font-medium">{booking.contactEmail}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notes cards */}
            {(booking.notes || booking.providerNotes || booking.declinedReason) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {booking.notes && (
                        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-2">
                            <h3 className="text-sm font-semibold text-muted-foreground">
                                {t('bookings.customer_notes', 'Customer Notes')}
                            </h3>
                            <p className="text-base">{booking.notes}</p>
                        </div>
                    )}
                    {booking.providerNotes && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-2">
                            <h3 className="text-sm font-semibold text-primary">
                                {t('bookings.provider_notes', 'Provider Notes')}
                            </h3>
                            <p className="text-base">{booking.providerNotes}</p>
                        </div>
                    )}
                    {booking.declinedReason && (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 space-y-2">
                            <h3 className="text-sm font-semibold text-destructive">
                                {t('bookings.decline_reason', 'Reason for Decline')}
                            </h3>
                            <p className="text-base">{booking.declinedReason}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Actions section */}
            <div className="flex flex-wrap gap-3">
                {/* Customer + PENDING → Cancel */}
                {isCustomer && booking.status === 'PENDING' && (
                    <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20 h-12"
                        onClick={() => setCancelOpen(true)}
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('bookings.cancel_booking', 'Cancel Booking')}
                    </Button>
                )}

                {/* Customer + CONFIRMED → Cancel */}
                {isCustomer && booking.status === 'CONFIRMED' && (
                    <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20 h-12"
                        onClick={() => setCancelOpen(true)}
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('bookings.cancel_booking', 'Cancel Booking')}
                    </Button>
                )}

                {/* Provider + PENDING → Confirm + Decline */}
                {isProvider && booking.status === 'PENDING' && (
                    <>
                        <Button
                            className="bg-success text-success-foreground hover:bg-success/90 h-12 px-6"
                            onClick={() => setConfirmOpen(true)}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            {t('bookings.confirm_booking', 'Confirm Booking')}
                        </Button>
                        <Button
                            variant="outline"
                            className="text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20 h-12"
                            onClick={() => setDeclineOpen(true)}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            {t('bookings.decline_booking', 'Decline Booking')}
                        </Button>
                    </>
                )}

                {/* Provider + CONFIRMED → Mark Complete */}
                {isProvider && booking.status === 'CONFIRMED' && (
                    <Button
                        className="bg-success text-success-foreground hover:bg-success/90 h-12 px-6"
                        onClick={() => setCompleteOpen(true)}
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t('bookings.mark_complete', 'Mark as Complete')}
                    </Button>
                )}
            </div>

            {/* Activity log */}
            <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3" aria-label="Booking activity timeline">
                <h2 className="text-lg font-semibold">
                    {t('bookings.activity_log', 'Activity Log')}
                </h2>
                <div className="space-y-2 text-base">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {t('bookings.log_created', 'Created on {{date}}', { date: fmtShortDate(booking.createdAt) })}
                    </div>
                    {booking.confirmedAt && (
                        <div className="flex items-center gap-2 text-primary">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t('bookings.log_confirmed', 'Confirmed on {{date}}', { date: fmtShortDate(booking.confirmedAt) })}
                        </div>
                    )}
                    {booking.declinedAt && (
                        <div className="flex items-center gap-2 text-destructive">
                            <XCircle className="h-3.5 w-3.5" />
                            {t('bookings.log_declined', 'Declined on {{date}}', { date: fmtShortDate(booking.declinedAt) })}
                        </div>
                    )}
                    {booking.cancelledAt && (
                        <div className="flex items-center gap-2 text-destructive">
                            <XCircle className="h-3.5 w-3.5" />
                            {t('bookings.log_cancelled', 'Cancelled on {{date}}', { date: fmtShortDate(booking.cancelledAt) })}
                        </div>
                    )}
                    {booking.completedAt && (
                        <div className="flex items-center gap-2 text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t('bookings.log_completed', 'Completed on {{date}}', { date: fmtShortDate(booking.completedAt) })}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Dialog */}
            {booking && (
                <ConfirmBookingDialog
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    onConfirm={handleConfirm}
                    isPending={confirmMutation.isPending}
                    entityName={booking.entityName}
                    customerName={customerName}
                />
            )}

            {/* Decline Dialog */}
            {booking && (
                <DeclineBookingDialog
                    open={declineOpen}
                    onOpenChange={setDeclineOpen}
                    onDecline={handleDecline}
                    isPending={declineMutation.isPending}
                    entityName={booking.entityName}
                    customerName={customerName}
                />
            )}

            {/* Complete Dialog */}
            <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('bookings.complete_confirm_title', 'Mark booking as complete?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('bookings.complete_confirm_description', 'This will mark the booking as completed. The customer will be notified.')}
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
                            {completeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('bookings.complete_action', 'Mark Complete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Dialog */}
            <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('bookings.cancel_confirm_title', 'Cancel booking?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('bookings.cancel_confirm_description', 'This will cancel your booking. The provider will be notified. You cannot undo this.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelMutation.isPending}>
                            {t('common.go_back', 'Go back')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            disabled={cancelMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('bookings.cancel_confirm', 'Yes, cancel booking')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

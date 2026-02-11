'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { CheckCircle2, CalendarCheck, Users, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useBooking } from '@/features/bookings/hooks/useBookings';
import { ROUTES } from '@/lib/constants/routes';

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

function fmtPrice(price: string | number | null, currency = 'GEL'): string {
    if (price == null) return '-';
    const sym: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€' };
    return `${sym[currency] ?? currency} ${Number(price)}`;
}

/* ── Component ─────────────────────────────── */

export function BookingConfirmation(): React.ReactNode {
    const { t } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;

    const { data: booking, isLoading } = useBooking(bookingId);
    const headingRef = useRef<HTMLHeadingElement>(null);

    // Focus heading on mount for accessibility
    useEffect(() => {
        if (booking && headingRef.current) {
            headingRef.current.focus();
        }
    }, [booking]);

    const handleCopyRef = (): void => {
        if (booking?.referenceNumber) {
            navigator.clipboard.writeText(booking.referenceNumber);
            toast.success(t('bookings.ref_copied', 'Reference number copied'));
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-32 w-full max-w-md rounded-xl" />
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

    const entityLabel = booking.entityName
        ?? `${booking.entityType.charAt(0) + booking.entityType.slice(1).toLowerCase()} Booking`;

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 max-w-md mx-auto text-center space-y-6">
            {/* Animated checkmark */}
            <div className="motion-safe:animate-bounce">
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
            </div>

            {/* Heading */}
            <div className="space-y-2">
                <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
                    {t('bookings.submitted_title', 'Booking Submitted!')}
                </h1>
                <p className="text-muted-foreground">
                    {t('bookings.submitted_description', 'Your booking request has been sent to the provider.')}
                </p>
            </div>

            {/* Reference number */}
            {booking.referenceNumber && (
                <button
                    onClick={handleCopyRef}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors group"
                >
                    <span className="font-mono text-lg font-bold tracking-wider">
                        {booking.referenceNumber}
                    </span>
                    <Copy className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
            )}

            {/* Summary */}
            <div className="w-full rounded-xl border border-border/50 bg-card p-5 space-y-3 text-left">
                <p className="font-semibold text-base">{entityLabel}</p>
                <div className="space-y-2 text-base">
                    {booking.date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarCheck className="h-4 w-4 shrink-0" />
                            <span>{fmtDate(booking.date)}</span>
                        </div>
                    )}
                    {booking.guests && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4 shrink-0" />
                            <span>{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</span>
                        </div>
                    )}
                    {booking.totalPrice && (
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-xl" aria-live="polite">{fmtPrice(booking.totalPrice, booking.currency)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Status message */}
            <div className="w-full rounded-xl bg-muted/50 border border-border/50 p-4">
                <p className="text-base text-muted-foreground">
                    {t(
                        'bookings.waiting_confirmation',
                        'Waiting for provider confirmation — you\'ll be notified by email when they respond.',
                    )}
                </p>
            </div>

            {/* Action buttons */}
            <div className="w-full space-y-3">
                <Link href={ROUTES.BOOKINGS.DETAIL(booking.id)} className="block">
                    <Button className="w-full h-12 text-base font-semibold">
                        {t('bookings.view_details', 'View Booking Details')}
                    </Button>
                </Link>
                <Link href={ROUTES.EXPLORE.TOURS} className="block">
                    <Button variant="ghost" className="w-full text-sm">
                        {t('bookings.browse_more', 'Browse More Tours')}
                    </Button>
                </Link>
            </div>
        </div>
    );
}

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import {
    CheckCircle2, ArrowLeft, ArrowRight, Loader2, Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

import { GuestCounter } from './GuestCounter';
import { useCreateBooking, useTourAvailability } from '@/features/bookings/hooks/useBookings';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

import type { AvailabilityType } from '@/features/tours/types/tour.types';

/* ── Types ─────────────────────────────────── */

interface TourBookingData {
    tourId: string;
    tourName: string;
    tourImage?: string | null;
    price: number;
    currency: string;
    maxPeople: number | null;
    availabilityType: AvailabilityType;
    availableDates: string[] | null;
    nextAvailableDate?: string | null;
}

interface DirectBookingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tour: TourBookingData;
}

/* ── Helpers ────────────────────────────────── */

const AVAILABILITY_LABELS: Record<AvailabilityType, string> = {
    DAILY: 'Available daily',
    WEEKDAYS: 'Weekdays only',
    WEEKENDS: 'Weekends only',
    SPECIFIC_DATES: 'Specific dates only',
    BY_REQUEST: 'By request',
};

function fmtCurrency(amount: number, currency = 'GEL'): string {
    const sym: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€' };
    return `${sym[currency] ?? currency} ${amount}`;
}

function fmtDateLong(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

function toISODate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/* ── Step Indicator ────────────────────────── */

const STEPS = [
    { number: 1, labelKey: 'bookings.step_date', fallback: 'Choose Date' },
    { number: 2, labelKey: 'bookings.step_guests', fallback: 'Guests' },
    { number: 3, labelKey: 'bookings.step_confirm', fallback: 'Confirm' },
];

function StepIndicator({ currentStep }: { currentStep: number }): React.ReactNode {
    const { t } = useTranslation();

    return (
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6" role="group" aria-label="Booking steps">
            {STEPS.map((step, index) => {
                const isCompleted = currentStep > step.number;
                const isCurrent = currentStep === step.number;
                const isLast = index === STEPS.length - 1;

                return (
                    <div key={step.number} className="flex items-center gap-2 sm:gap-4">
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className={cn(
                                    'flex items-center justify-center h-9 w-9 rounded-full text-sm font-bold transition-all',
                                    isCompleted && 'bg-primary text-primary-foreground',
                                    isCurrent && 'bg-primary text-primary-foreground motion-safe:ring-4 motion-safe:ring-primary/20',
                                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground',
                                )}
                                {...(isCurrent ? { 'aria-current': 'step' as const } : {})}
                            >
                                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.number}
                            </div>
                            <span className={cn(
                                'text-sm font-medium whitespace-nowrap',
                                isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground',
                            )}>
                                {t(step.labelKey, step.fallback)}
                            </span>
                        </div>
                        {!isLast && (
                            <div className={cn(
                                'h-0.5 w-8 sm:w-12 mt-[-1rem]',
                                isCompleted ? 'bg-primary' : 'bg-border',
                            )} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ── Main Dialog ───────────────────────────── */

export function DirectBookingDialog({
    open,
    onOpenChange,
    tour,
}: DirectBookingDialogProps): React.ReactNode {
    const { t } = useTranslation();
    const router = useRouter();
    const createBooking = useCreateBooking();

    // State
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
    const [guests, setGuests] = useState(1);
    const [notes, setNotes] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    // Availability check
    const dateStr = selectedDate ? toISODate(selectedDate) : null;
    const { data: availability, isLoading: checkingAvailability } = useTourAvailability(
        tour.tourId,
        dateStr,
        guests,
    );

    const maxGuests = availability?.remainingSpots ?? tour.maxPeople ?? 50;
    const totalPrice = tour.price * guests;

    // Calendar date disabling
    const disabledDays = useMemo((): ((date: Date) => boolean) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return (date: Date): boolean => {
            // Disable today and past dates (booking must be in the future)
            if (date <= today) return true;

            switch (tour.availabilityType) {
                case 'WEEKDAYS': {
                    const day = date.getDay();
                    return day === 0 || day === 6; // Disable weekends
                }
                case 'WEEKENDS': {
                    const day = date.getDay();
                    return day !== 0 && day !== 6; // Disable weekdays
                }
                case 'SPECIFIC_DATES': {
                    const dateIso = toISODate(date);
                    if (tour.availableDates && tour.availableDates.length > 0) {
                        return !tour.availableDates.includes(dateIso);
                    }
                    // Fallback: if no availableDates but nextAvailableDate exists, allow that date
                    if (tour.nextAvailableDate) {
                        const nextDate = new Date(tour.nextAvailableDate);
                        nextDate.setHours(0, 0, 0, 0);
                        return toISODate(date) !== toISODate(nextDate);
                    }
                    return true;
                }
                case 'DAILY':
                case 'BY_REQUEST':
                default:
                    return false;
            }
        };
    }, [tour.availabilityType, tour.availableDates, tour.nextAvailableDate]);

    // Parse nextAvailableDate from the tour as a fallback
    const parsedNextAvailable = useMemo((): Date | undefined => {
        if (!tour.nextAvailableDate) return undefined;
        const d = new Date(tour.nextAvailableDate);
        if (isNaN(d.getTime())) return undefined;
        d.setHours(0, 0, 0, 0);
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return d >= tomorrow ? d : undefined;
    }, [tour.nextAvailableDate]);

    // Compute the first available date so the calendar opens to the right month
    const firstAvailableDate = useMemo((): Date | undefined => {
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch (tour.availabilityType) {
            case 'SPECIFIC_DATES': {
                if (tour.availableDates && tour.availableDates.length > 0) {
                    const sorted = [...tour.availableDates].sort();
                    for (const ds of sorted) {
                        const [y, m, d] = ds.split('-').map(Number);
                        const date = new Date(y, m - 1, d);
                        if (date >= tomorrow) return date;
                    }
                }
                // Fallback to nextAvailableDate from the server
                return parsedNextAvailable ?? tomorrow;
            }
            case 'WEEKDAYS': {
                const d = new Date(tomorrow);
                while (d.getDay() === 0 || d.getDay() === 6) {
                    d.setDate(d.getDate() + 1);
                }
                return d;
            }
            case 'WEEKENDS': {
                const d = new Date(tomorrow);
                while (d.getDay() !== 0 && d.getDay() !== 6) {
                    d.setDate(d.getDate() + 1);
                }
                return d;
            }
            case 'DAILY':
            case 'BY_REQUEST':
            default:
                return parsedNextAvailable ?? tomorrow;
        }
    }, [tour.availabilityType, tour.availableDates, parsedNextAvailable]);

    // Set calendar to first available date when dialog opens
    useEffect(() => {
        if (open) {
            const target = firstAvailableDate ?? new Date();
            setCalendarMonth(target);
            setSelectedDate(firstAvailableDate);
        }
    }, [open, firstAvailableDate]);

    // Reset state when dialog closes
    const handleOpenChange = useCallback((value: boolean): void => {
        if (!value) {
            setStep(1);
            setSelectedDate(undefined);
            setCalendarMonth(new Date());
            setGuests(1);
            setNotes('');
            setContactPhone('');
        }
        onOpenChange(value);
    }, [onOpenChange]);

    // Submit
    const handleSubmit = useCallback((): void => {
        if (!selectedDate) return;

        createBooking.mutate(
            {
                entityType: 'TOUR',
                entityId: tour.tourId,
                date: toISODate(selectedDate),
                guests,
                notes: notes.trim() || undefined,
                contactPhone: contactPhone.trim() || undefined,
            },
            {
                onSuccess: (booking) => {
                    handleOpenChange(false);
                    router.push(ROUTES.BOOKINGS.CONFIRMATION(booking.id));
                },
            },
        );
    }, [selectedDate, tour.tourId, guests, notes, contactPhone, createBooking, handleOpenChange, router]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {t('bookings.book_tour', 'Book Tour')}
                    </DialogTitle>
                    <DialogDescription>
                        {tour.tourName}
                    </DialogDescription>
                </DialogHeader>

                <StepIndicator currentStep={step} />

                {/* ── Step 1: Choose Date ── */}
                {step === 1 && (
                    <div className="space-y-4" role="group" aria-label="Step 1: Choose a date">
                        <div className="flex items-center gap-2 text-base text-muted-foreground bg-muted/50 rounded-lg p-3">
                            <Info className="h-4 w-4 shrink-0" />
                            <span>{AVAILABILITY_LABELS[tour.availabilityType]}</span>
                            {tour.availabilityType === 'BY_REQUEST' && (
                                <span className="text-xs">
                                    — {t('bookings.by_request_note', 'the provider will confirm your preferred date')}
                                </span>
                            )}
                        </div>

                        <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={disabledDays}
                                month={calendarMonth}
                                onMonthChange={setCalendarMonth}
                                fromDate={new Date()}
                                aria-label="Select a booking date"
                            />
                        </div>

                        {selectedDate && (
                            <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <p className="text-lg font-semibold text-primary">
                                    {fmtDateLong(selectedDate)}
                                </p>
                            </div>
                        )}

                        <Button
                            className="w-full h-12 text-base font-semibold"
                            disabled={!selectedDate}
                            onClick={() => setStep(2)}
                        >
                            {t('common.next', 'Next')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* ── Step 2: Choose Guests ── */}
                {step === 2 && (
                    <div className="space-y-6" role="group" aria-label="Step 2: Choose number of guests">
                        <div className="text-center space-y-2">
                            <Label className="text-lg font-medium">
                                {t('bookings.how_many_guests', 'How many guests?')}
                            </Label>
                            {checkingAvailability ? (
                                <p className="text-base text-muted-foreground flex items-center justify-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    {t('bookings.checking_availability', 'Checking availability...')}
                                </p>
                            ) : availability && (
                                <p className="text-base text-muted-foreground">
                                    {t('bookings.spots_remaining', '{{count}} spots remaining for this date', {
                                        count: availability.remainingSpots,
                                    })}
                                </p>
                            )}
                        </div>

                        <GuestCounter
                            value={guests}
                            min={1}
                            max={maxGuests}
                            onChange={setGuests}
                            disabled={checkingAvailability}
                        />

                        <div className="space-y-2 text-center">
                            <p className="text-base text-muted-foreground">
                                {fmtCurrency(tour.price, tour.currency)} {t('bookings.per_person', 'per person')}
                            </p>
                            <p className="text-xl font-bold" aria-live="polite">
                                {t('bookings.total', 'Total')}: {fmtCurrency(totalPrice, tour.currency)}
                            </p>
                        </div>

                        {availability && !availability.available && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                                <p className="text-sm text-destructive font-medium">
                                    {availability.reason ?? t('bookings.not_available', 'Not enough spots available for this date')}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 h-12"
                                onClick={() => setStep(1)}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('common.back', 'Back')}
                            </Button>
                            <Button
                                className="flex-1 h-12 text-base font-semibold"
                                disabled={checkingAvailability || (availability != null && !availability.available)}
                                onClick={() => setStep(3)}
                            >
                                {t('common.next', 'Next')}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Review & Confirm ── */}
                {step === 3 && selectedDate && (
                    <div className="space-y-5" role="group" aria-label="Step 3: Review and confirm booking">
                        {/* Summary card */}
                        <div className="rounded-xl border border-border/50 overflow-hidden">
                            {/* Hero image */}
                            {tour.tourImage ? (
                                <div className="relative h-44 w-full">
                                    <img
                                        src={tour.tourImage}
                                        alt={tour.tourName}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                    <p className="absolute bottom-3 left-4 right-4 font-semibold text-white text-base truncate">
                                        {tour.tourName}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-muted/30 px-4 pt-4 pb-2">
                                    <p className="font-semibold text-base truncate">{tour.tourName}</p>
                                </div>
                            )}

                            {/* Booking details */}
                            <div className="grid grid-cols-2 gap-3 text-sm p-4">
                                <div>
                                    <p className="text-muted-foreground">{t('bookings.date_label', 'Date')}</p>
                                    <p className="font-medium mt-0.5">{fmtDateLong(selectedDate)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{t('bookings.guests_label', 'Guests')}</p>
                                    <p className="font-medium mt-0.5">{guests}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{t('bookings.price_per_person', 'Price per person')}</p>
                                    <p className="font-medium mt-0.5">{fmtCurrency(tour.price, tour.currency)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{t('bookings.total', 'Total')}</p>
                                    <p className="text-lg font-bold mt-0.5">{fmtCurrency(totalPrice, tour.currency)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Optional fields */}
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="booking-notes" className="text-base">
                                    {t('bookings.notes_label', 'Special requests or notes (optional)')}
                                </Label>
                                <Textarea
                                    id="booking-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={t('bookings.notes_placeholder', 'Any special requests for the provider...')}
                                    rows={2}
                                    maxLength={1000}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="booking-phone" className="text-base">
                                    {t('bookings.phone_optional', 'Contact phone (optional)')}
                                </Label>
                                <Input
                                    id="booking-phone"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    placeholder="+995 5XX XXX XXX"
                                    maxLength={20}
                                    type="tel"
                                />
                            </div>
                        </div>

                        {/* Info text */}
                        <div className="rounded-lg bg-muted/50 p-3 text-base text-muted-foreground">
                            <p>
                                {t(
                                    'bookings.confirm_info',
                                    'After you confirm, the tour provider will review your booking request. You\'ll be notified when they respond.',
                                )}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 h-12"
                                onClick={() => setStep(2)}
                                disabled={createBooking.isPending}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('common.go_back', 'Go Back')}
                            </Button>
                            <Button
                                className="flex-1 h-12 text-base font-semibold"
                                onClick={handleSubmit}
                                disabled={createBooking.isPending}
                            >
                                {createBooking.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                )}
                                {t('bookings.confirm_booking', 'Confirm Booking')}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

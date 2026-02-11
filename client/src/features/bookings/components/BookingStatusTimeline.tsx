'use client';

import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, XCircle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { BookingStatus } from '@/features/bookings/types/booking.types';

interface TimelineStep {
    label: string;
    status: 'completed' | 'current' | 'upcoming' | 'error';
    timestamp?: string | null;
    icon: React.ElementType;
}

function fmtTimestamp(dateStr: string | null | undefined): string | undefined {
    if (!dateStr) return undefined;
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(dateStr));
}

interface BookingStatusTimelineProps {
    status: BookingStatus;
    createdAt: string;
    confirmedAt?: string | null;
    completedAt?: string | null;
    cancelledAt?: string | null;
    declinedAt?: string | null;
}

export function BookingStatusTimeline({
    status,
    createdAt,
    confirmedAt,
    completedAt,
    cancelledAt,
    declinedAt,
}: BookingStatusTimelineProps): React.ReactNode {
    const { t } = useTranslation();

    const steps: TimelineStep[] = [];

    if (status === 'DECLINED') {
        steps.push(
            {
                label: t('bookings.timeline.submitted', 'Submitted'),
                status: 'completed',
                timestamp: createdAt,
                icon: CheckCircle2,
            },
            {
                label: t('bookings.timeline.declined', 'Declined'),
                status: 'error',
                timestamp: declinedAt,
                icon: XCircle,
            },
        );
    } else if (status === 'CANCELLED') {
        steps.push(
            {
                label: t('bookings.timeline.submitted', 'Submitted'),
                status: 'completed',
                timestamp: createdAt,
                icon: CheckCircle2,
            },
        );
        if (confirmedAt) {
            steps.push({
                label: t('bookings.timeline.confirmed', 'Confirmed'),
                status: 'completed',
                timestamp: confirmedAt,
                icon: CheckCircle2,
            });
        }
        steps.push({
            label: t('bookings.timeline.cancelled', 'Cancelled'),
            status: 'error',
            timestamp: cancelledAt,
            icon: Ban,
        });
    } else {
        // Normal flow: Submitted → Confirmed → Completed
        steps.push({
            label: t('bookings.timeline.submitted', 'Submitted'),
            status: status === 'PENDING' ? 'current' : 'completed',
            timestamp: createdAt,
            icon: status === 'PENDING' ? Clock : CheckCircle2,
        });
        steps.push({
            label: t('bookings.timeline.confirmed', 'Confirmed'),
            status: status === 'CONFIRMED' ? 'current' : status === 'COMPLETED' ? 'completed' : 'upcoming',
            timestamp: confirmedAt,
            icon: status === 'CONFIRMED' ? Clock : status === 'COMPLETED' ? CheckCircle2 : Clock,
        });
        steps.push({
            label: t('bookings.timeline.completed', 'Completed'),
            status: status === 'COMPLETED' ? 'completed' : 'upcoming',
            timestamp: completedAt,
            icon: status === 'COMPLETED' ? CheckCircle2 : Clock,
        });
    }

    return (
        <div className="w-full" role="group" aria-label={t('bookings.timeline.label', 'Booking status: {{status}}', { status })}>
            {/* Desktop horizontal timeline */}
            <div className="hidden sm:flex items-start justify-between relative">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.label} className="flex flex-col items-center relative flex-1">
                            {/* Connector line */}
                            {!isLast && (
                                <div
                                    className={cn(
                                        'absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5',
                                        step.status === 'completed' ? 'bg-primary' :
                                        step.status === 'error' ? 'bg-destructive' : 'bg-border',
                                    )}
                                />
                            )}

                            {/* Circle */}
                            <div
                                className={cn(
                                    'relative z-10 flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all',
                                    step.status === 'completed' && 'bg-primary border-primary text-primary-foreground',
                                    step.status === 'current' && 'bg-primary/10 border-primary text-primary motion-safe:animate-pulse',
                                    step.status === 'upcoming' && 'bg-muted border-border text-muted-foreground',
                                    step.status === 'error' && 'bg-destructive/10 border-destructive text-destructive',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                            </div>

                            {/* Label */}
                            <span className={cn(
                                'mt-2 text-base font-medium text-center',
                                step.status === 'completed' && 'text-foreground',
                                step.status === 'current' && 'text-primary',
                                step.status === 'upcoming' && 'text-muted-foreground',
                                step.status === 'error' && 'text-destructive',
                            )}>
                                {step.label}
                            </span>

                            {/* Timestamp */}
                            {step.timestamp && (
                                <span className="mt-0.5 text-xs text-muted-foreground text-center">
                                    {fmtTimestamp(step.timestamp)}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile vertical timeline */}
            <div className="sm:hidden space-y-0">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.label} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        'flex items-center justify-center h-8 w-8 rounded-full border-2 shrink-0',
                                        step.status === 'completed' && 'bg-primary border-primary text-primary-foreground',
                                        step.status === 'current' && 'bg-primary/10 border-primary text-primary motion-safe:animate-pulse',
                                        step.status === 'upcoming' && 'bg-muted border-border text-muted-foreground',
                                        step.status === 'error' && 'bg-destructive/10 border-destructive text-destructive',
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>
                                {!isLast && (
                                    <div
                                        className={cn(
                                            'w-0.5 h-8',
                                            step.status === 'completed' ? 'bg-primary' :
                                            step.status === 'error' ? 'bg-destructive' : 'bg-border',
                                        )}
                                    />
                                )}
                            </div>
                            <div className="pb-6">
                                <p className={cn(
                                    'text-base font-medium',
                                    step.status === 'completed' && 'text-foreground',
                                    step.status === 'current' && 'text-primary',
                                    step.status === 'upcoming' && 'text-muted-foreground',
                                    step.status === 'error' && 'text-destructive',
                                )}>
                                    {step.label}
                                </p>
                                {step.timestamp && (
                                    <p className="text-xs text-muted-foreground">
                                        {fmtTimestamp(step.timestamp)}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

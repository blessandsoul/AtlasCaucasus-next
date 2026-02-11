'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { XCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeclineBookingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDecline: (reason: string) => void;
    isPending: boolean;
    entityName: string | null;
    customerName: string;
}

export function DeclineBookingDialog({
    open,
    onOpenChange,
    onDecline,
    isPending,
    entityName,
    customerName,
}: DeclineBookingDialogProps): React.ReactNode {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');

    const handleDecline = useCallback((): void => {
        if (reason.trim().length === 0) return;
        onDecline(reason.trim());
    }, [onDecline, reason]);

    const handleOpenChange = useCallback((value: boolean): void => {
        if (!value) {
            setReason('');
        }
        onOpenChange(value);
    }, [onOpenChange]);

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-destructive" />
                        {t('bookings.decline_title', 'Decline Booking')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t(
                            'bookings.decline_description',
                            'Decline {{customerName}}\'s booking for {{entityName}}. The customer will be notified with your reason.',
                            { customerName, entityName: entityName ?? 'this service' },
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2 py-2">
                    <Label htmlFor="decline-reason" className="text-base font-medium">
                        {t('bookings.decline_reason_label', 'Reason for declining')}
                        <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Textarea
                        id="decline-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t(
                            'bookings.decline_reason_placeholder',
                            'e.g., Fully booked on this date, tour not running this season...',
                        )}
                        maxLength={1000}
                        rows={3}
                        disabled={isPending}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('bookings.decline_reason_hint', 'Please provide a reason — the customer will see this.')}
                        {' '}{reason.length}/1000
                    </p>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                        {t('common.cancel', 'Cancel')}
                    </AlertDialogCancel>
                    <Button
                        onClick={handleDecline}
                        disabled={isPending || reason.trim().length === 0}
                        variant="destructive"
                        className="h-12 text-base"
                    >
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                        )}
                        {t('bookings.decline_action', 'Decline Booking')}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

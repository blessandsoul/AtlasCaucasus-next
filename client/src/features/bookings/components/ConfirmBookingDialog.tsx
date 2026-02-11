'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2 } from 'lucide-react';

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

interface ConfirmBookingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (providerNotes?: string) => void;
    isPending: boolean;
    entityName: string | null;
    customerName: string;
}

export function ConfirmBookingDialog({
    open,
    onOpenChange,
    onConfirm,
    isPending,
    entityName,
    customerName,
}: ConfirmBookingDialogProps): React.ReactNode {
    const { t } = useTranslation();
    const [notes, setNotes] = useState('');

    const handleConfirm = useCallback((): void => {
        onConfirm(notes.trim() || undefined);
    }, [onConfirm, notes]);

    const handleOpenChange = useCallback((value: boolean): void => {
        if (!value) {
            setNotes('');
        }
        onOpenChange(value);
    }, [onOpenChange]);

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        {t('bookings.confirm_title', 'Confirm Booking')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t(
                            'bookings.confirm_description',
                            'Confirm {{customerName}}\'s booking for {{entityName}}. The customer will be notified.',
                            { customerName, entityName: entityName ?? 'this service' },
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2 py-2">
                    <Label htmlFor="provider-notes" className="text-base font-medium">
                        {t('bookings.provider_notes_label', 'Add a note for the customer (optional)')}
                    </Label>
                    <Textarea
                        id="provider-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t(
                            'bookings.provider_notes_placeholder',
                            'e.g., Meeting point details, what to bring...',
                        )}
                        maxLength={1000}
                        rows={3}
                        disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                        {notes.length}/1000
                    </p>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                        {t('common.cancel', 'Cancel')}
                    </AlertDialogCancel>
                    <Button
                        onClick={handleConfirm}
                        disabled={isPending}
                        className="bg-success text-success-foreground hover:bg-success/90 h-12 text-base"
                    >
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        {t('bookings.confirm_action', 'Confirm Booking')}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

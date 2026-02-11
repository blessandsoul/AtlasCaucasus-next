'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { inquiryService } from '../services/inquiry.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { InquiryTargetType, CreateInquiryInput } from '../types/inquiry.types';

const inquirySchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be under 200 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be under 2000 characters'),
});

interface RequestInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: InquiryTargetType;
  targetId: string;
  entityTitle: string;
  entitySubtitle?: string;
  defaultSubject: string;
}

export const RequestInquiryDialog = ({
  open,
  onOpenChange,
  targetType,
  targetId,
  entityTitle,
  entitySubtitle,
  defaultSubject,
}: RequestInquiryDialogProps): JSX.Element => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>(
    {}
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSubject(defaultSubject);
      setMessage('');
      setPreferredDate('');
      setGuestCount('');
      setErrors({});
    }
  }, [open, defaultSubject]);

  const mutation = useMutation({
    mutationFn: (data: CreateInquiryInput) => inquiryService.createInquiry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      toast.success(t('inquiry_dialog.success'));
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = useCallback(() => {
    const result = inquirySchema.safeParse({ subject, message });
    if (!result.success) {
      const fieldErrors: { subject?: string; message?: string } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as 'subject' | 'message';
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    // Append optional date/guests as structured data
    let finalMessage = result.data.message;
    const extras: string[] = [];
    if (preferredDate) {
      const formatted = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      }).format(new Date(preferredDate));
      extras.push(`Preferred date: ${formatted}`);
    }
    if (guestCount && parseInt(guestCount, 10) > 0) {
      extras.push(`Guests: ${guestCount}`);
    }
    if (extras.length > 0) {
      finalMessage += `\n---\n${extras.join('\n')}`;
    }

    mutation.mutate({
      targetType,
      targetIds: [targetId],
      subject: result.data.subject,
      message: finalMessage,
    });
  }, [subject, message, preferredDate, guestCount, targetType, targetId, mutation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('inquiry_dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('inquiry_dialog.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Entity context */}
        <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
          <p className="text-sm font-medium text-foreground">{entityTitle}</p>
          {entitySubtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {entitySubtitle}
            </p>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inquiry-subject">
              {t('inquiry_dialog.subject')}
            </Label>
            <Input
              id="inquiry-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className={errors.subject ? 'border-destructive' : ''}
            />
            {errors.subject && (
              <p className="text-xs text-destructive">{errors.subject}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inquiry-message">
              {t('inquiry_dialog.message')}
            </Label>
            <Textarea
              id="inquiry-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('inquiry_dialog.message_placeholder')}
              rows={4}
              maxLength={2000}
              className={errors.message ? 'border-destructive' : ''}
            />
            <div className="flex items-center justify-between">
              {errors.message ? (
                <p className="text-xs text-destructive">{errors.message}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-muted-foreground">
                {message.length}/2000
              </p>
            </div>
          </div>

          {/* Optional date and guests fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="inquiry-date" className="text-sm">
                {t('inquiry_dialog.preferred_date', 'Preferred date (optional)')}
              </Label>
              <Input
                id="inquiry-date"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inquiry-guests" className="text-sm">
                {t('inquiry_dialog.guest_count', 'Number of guests (optional)')}
              </Label>
              <Input
                id="inquiry-guests"
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                min={1}
                max={100}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('inquiry_dialog.sending')}
              </>
            ) : (
              t('inquiry_dialog.send')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

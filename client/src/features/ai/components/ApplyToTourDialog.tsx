'use client';

import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMyTours } from '@/features/tours/hooks/useTours';
import { useApplyToTour } from '../hooks/useAiStudio';

interface ApplyToTourDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generationId: string;
}

const FIELD_OPTIONS = [
  { value: 'description', label: 'Description' },
  { value: 'summary', label: 'Summary' },
  { value: 'itinerary', label: 'Itinerary' },
] as const;

export function ApplyToTourDialog({
  open,
  onOpenChange,
  generationId,
}: ApplyToTourDialogProps): React.ReactElement {
  const { t } = useTranslation();
  const [selectedTourId, setSelectedTourId] = useState('');
  const [selectedField, setSelectedField] = useState<'description' | 'summary' | 'itinerary'>('description');

  const { data: toursData, isLoading: toursLoading } = useMyTours({ limit: 100 });
  const applyMutation = useApplyToTour();

  const handleApply = useCallback(() => {
    if (!selectedTourId || !generationId) return;

    applyMutation.mutate(
      {
        generationId,
        tourId: selectedTourId,
        field: selectedField,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedTourId('');
          setSelectedField('description');
        },
      }
    );
  }, [selectedTourId, generationId, selectedField, applyMutation, onOpenChange]);

  const tours = toursData?.items || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('ai.apply_to_tour', 'Apply to tour')}</DialogTitle>
          <DialogDescription>
            {t('ai.apply_to_tour_desc', 'Select a tour and field to apply the generated content to.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t('ai.select_tour', 'Tour')}</Label>
            {toursLoading ? (
              <div className="flex h-10 items-center justify-center rounded-md border">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : tours.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('ai.no_tours', 'You have no tours yet.')}
              </p>
            ) : (
              <Select value={selectedTourId} onValueChange={setSelectedTourId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('ai.select_tour_placeholder', 'Choose a tour')} />
                </SelectTrigger>
                <SelectContent>
                  {tours.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id}>
                      {tour.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t('ai.select_field', 'Field')}</Label>
            <Select value={selectedField} onValueChange={(v) => setSelectedField(v as typeof selectedField)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`ai.field_option.${option.value}`, option.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="transition-all duration-200 active:scale-[0.98]"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleApply}
            disabled={!selectedTourId || applyMutation.isPending}
            className="transition-all duration-200 active:scale-[0.98]"
          >
            {applyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('ai.applying', 'Applying...')}
              </>
            ) : (
              t('ai.apply', 'Apply')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

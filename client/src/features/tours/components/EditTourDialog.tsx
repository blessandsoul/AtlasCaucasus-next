'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUpdateTour } from '../hooks/useTours';
import { TourImageManager } from './TourImageManager';
import type { Tour, UpdateTourInput } from '../types/tour.types';

const editTourSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    price: z.coerce.number().min(0, 'Price must be at least 0'),
    summary: z.string().max(1000).optional().nullable(),
    currency: z.string().length(3, 'Currency must be exactly 3 characters'),
    city: z.string().max(100).optional().nullable(),
    startLocation: z.string().max(100).optional().nullable(),
    durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
    maxPeople: z.coerce.number().int().min(1).optional().nullable(),
    isActive: z.boolean(),
    isInstantBooking: z.boolean(),
    hasFreeCancellation: z.boolean(),
});

type EditTourFormData = z.infer<typeof editTourSchema>;

interface EditTourDialogProps {
    tour: Tour | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const EditTourDialog = ({ tour, open, onOpenChange }: EditTourDialogProps) => {
    const { t } = useTranslation();
    const updateTour = useUpdateTour();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<EditTourFormData>({
        resolver: zodResolver(editTourSchema),
        defaultValues: {
            title: '',
            price: 0,
            summary: '',
            currency: 'GEL',
            city: '',
            startLocation: '',
            durationMinutes: null,
            maxPeople: null,
            isActive: true,
            isInstantBooking: false,
            hasFreeCancellation: false,
        },
    });

    useEffect(() => {
        if (tour && open) {
            reset({
                title: tour.title,
                price: Number(tour.price),
                summary: tour.summary || '',
                currency: tour.currency,
                city: tour.city || '',
                startLocation: tour.startLocation || '',
                durationMinutes: tour.durationMinutes,
                maxPeople: tour.maxPeople,
                isActive: tour.isActive,
                isInstantBooking: tour.isInstantBooking,
                hasFreeCancellation: tour.hasFreeCancellation,
            });
        }
    }, [tour, open, reset]);

    const onSubmit = async (data: EditTourFormData) => {
        if (!tour) return;

        const updateData: UpdateTourInput = {
            title: data.title,
            price: data.price,
            summary: data.summary || null,
            currency: data.currency,
            city: data.city || null,
            startLocation: data.startLocation || null,
            durationMinutes: data.durationMinutes,
            maxPeople: data.maxPeople,
            isActive: data.isActive,
            isInstantBooking: data.isInstantBooking,
            hasFreeCancellation: data.hasFreeCancellation,
        };

        updateTour.mutate(
            { id: tour.id, data: updateData },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    const isActive = watch('isActive');
    const isInstantBooking = watch('isInstantBooking');
    const hasFreeCancellation = watch('hasFreeCancellation');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('tours.edit.title', 'Edit Tour')}</DialogTitle>
                    <DialogDescription>
                        {t('tours.edit.description', 'Update the details of your tour.')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">{t('tours.create.tour_title', 'Tour Title')} *</Label>
                        <Input
                            id="title"
                            {...register('title')}
                            aria-invalid={!!errors.title}
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive">{errors.title.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="summary">{t('tours.create.summary', 'Summary')}</Label>
                        <Textarea
                            id="summary"
                            {...register('summary')}
                            rows={3}
                            placeholder={t('tours.create.summary_placeholder', 'Describe the highlights and experience...')}
                        />
                        {errors.summary && (
                            <p className="text-sm text-destructive">{errors.summary.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">{t('tours.create.price', 'Price')} *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                {...register('price')}
                                aria-invalid={!!errors.price}
                            />
                            {errors.price && (
                                <p className="text-sm text-destructive">{errors.price.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency">{t('tours.create.currency', 'Currency')}</Label>
                            <Select
                                value={watch('currency')}
                                onValueChange={(value) => setValue('currency', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('tours.create.select_currency', 'Select currency')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GEL">GEL</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">{t('tours.create.region', 'Region / City')}</Label>
                            <Input
                                id="city"
                                {...register('city')}
                                placeholder={t('tours.create.region_placeholder', 'e.g. Tbilisi')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startLocation">{t('tours.create.meeting_point', 'Meeting Point')}</Label>
                            <Input
                                id="startLocation"
                                {...register('startLocation')}
                                placeholder={t('tours.create.meeting_point_placeholder', 'e.g. Freedom Square Metro')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="durationMinutes">{t('tours.create.duration', 'Duration (minutes)')}</Label>
                            <Input
                                id="durationMinutes"
                                type="number"
                                min="0"
                                {...register('durationMinutes')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxPeople">{t('tours.create.max_group_size', 'Max Group Size')}</Label>
                            <Input
                                id="maxPeople"
                                type="number"
                                min="1"
                                {...register('maxPeople')}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={(checked) => setValue('isActive', checked === true)}
                            />
                            <div className="grid gap-0.5">
                                <Label htmlFor="isActive" className="cursor-pointer">
                                    {t('tours.edit.is_active', 'Active')}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {t('tours.edit.is_active_desc', 'Tour is visible to customers')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isInstantBooking"
                                checked={isInstantBooking}
                                onCheckedChange={(checked) => setValue('isInstantBooking', checked === true)}
                            />
                            <div className="grid gap-0.5">
                                <Label htmlFor="isInstantBooking" className="cursor-pointer">
                                    {t('tours.create.instant_booking', 'Instant Booking')}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {t('tours.create.instant_booking_desc', 'Allow customers to book without manual approval.')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hasFreeCancellation"
                                checked={hasFreeCancellation}
                                onCheckedChange={(checked) => setValue('hasFreeCancellation', checked === true)}
                            />
                            <div className="grid gap-0.5">
                                <Label htmlFor="hasFreeCancellation" className="cursor-pointer">
                                    {t('tours.create.free_cancellation', 'Free Cancellation')}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {t('tours.create.free_cancellation_desc', 'Full refund if cancelled 24h before.')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {tour && (
                        <>
                            <Separator className="my-4" />
                            <TourImageManager tourId={tour.id} />
                        </>
                    )}

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" disabled={updateTour.isPending}>
                            {updateTour.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

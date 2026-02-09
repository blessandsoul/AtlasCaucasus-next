'use client';

import { useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, X, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useUpdateTour } from '../hooks/useTours';
import { TourImageManager } from './TourImageManager';
import type { Tour, UpdateTourInput, AvailabilityType } from '../types/tour.types';

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
    availabilityType: z.enum(['DAILY', 'WEEKDAYS', 'WEEKENDS', 'SPECIFIC_DATES', 'BY_REQUEST']),
    availableDates: z.array(z.string()).optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format').optional().or(z.literal('')),
    itinerary: z.array(z.object({
        title: z.string().min(1, 'Step title is required').max(200),
        description: z.string().min(1, 'Step description is required').max(2000),
    })).max(30).optional(),
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
        control,
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
            availabilityType: 'BY_REQUEST' as const,
            availableDates: [],
            startTime: '',
            itinerary: [],
        },
    });

    const { fields: itineraryFields, append: appendStep, remove: removeStep, swap: swapSteps } = useFieldArray({
        control,
        name: 'itinerary',
    });

    const handleAddStep = useCallback((): void => {
        if (itineraryFields.length >= 30) return;
        appendStep({ title: '', description: '' });
    }, [itineraryFields.length, appendStep]);

    const handleMoveUp = useCallback((index: number): void => {
        if (index > 0) swapSteps(index, index - 1);
    }, [swapSteps]);

    const handleMoveDown = useCallback((index: number): void => {
        if (index < itineraryFields.length - 1) swapSteps(index, index + 1);
    }, [swapSteps, itineraryFields.length]);

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
                availabilityType: tour.availabilityType || 'BY_REQUEST',
                availableDates: tour.availableDates || [],
                startTime: tour.startTime || '',
                itinerary: tour.itinerary || [],
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
            availabilityType: data.availabilityType as AvailabilityType,
            availableDates: data.availabilityType === 'SPECIFIC_DATES' && data.availableDates?.length
                ? data.availableDates
                : null,
            startTime: data.startTime || null,
            itinerary: data.itinerary?.length ? data.itinerary : null,
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
    const availabilityType = watch('availabilityType');
    const availableDates = watch('availableDates') || [];

    const handleDateSelect = (date: Date | undefined): void => {
        if (!date) return;
        const dateStr = date.toISOString().split('T')[0];
        const current = availableDates;
        if (current.includes(dateStr)) {
            setValue('availableDates', current.filter((d) => d !== dateStr));
        } else {
            setValue('availableDates', [...current, dateStr].sort());
        }
    };

    const removeDate = (dateStr: string): void => {
        setValue('availableDates', availableDates.filter((d) => d !== dateStr));
    };

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

                    {/* Availability Section */}
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="availabilityType">{t('tours.create.availability_type', 'Availability')}</Label>
                            <Select
                                value={availabilityType}
                                onValueChange={(value) => setValue('availabilityType', value as AvailabilityType)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('tours.create.select_availability', 'Select availability')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BY_REQUEST">{t('tour_availability.by_request', 'By request')}</SelectItem>
                                    <SelectItem value="DAILY">{t('tour_availability.daily', 'Available daily')}</SelectItem>
                                    <SelectItem value="WEEKDAYS">{t('tour_availability.weekdays', 'Weekdays only')}</SelectItem>
                                    <SelectItem value="WEEKENDS">{t('tour_availability.weekends', 'Weekends only')}</SelectItem>
                                    <SelectItem value="SPECIFIC_DATES">{t('tour_availability.specific_dates', 'Specific dates')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('tours.create.default_start_time', 'Default Start Time')}</Label>
                            <TimePicker
                                value={(() => {
                                    const val = watch('startTime');
                                    if (!val) return undefined;
                                    const [h, m] = val.split(':').map(Number);
                                    const d = new Date();
                                    d.setHours(h, m, 0, 0);
                                    return d;
                                })()}
                                onChange={(date) => {
                                    const hh = date.getHours().toString().padStart(2, '0');
                                    const mm = date.getMinutes().toString().padStart(2, '0');
                                    setValue('startTime', `${hh}:${mm}`);
                                }}
                            />
                            {errors.startTime && (
                                <p className="text-sm text-destructive">{errors.startTime.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Specific Dates Picker */}
                    {availabilityType === 'SPECIFIC_DATES' && (
                        <div className="space-y-2">
                            <Label>{t('tours.create.available_dates', 'Available Dates')}</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !availableDates.length && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {availableDates.length > 0
                                            ? t('tours.create.dates_selected', '{{count}} date(s) selected', { count: availableDates.length })
                                            : t('tours.create.pick_dates', 'Pick dates')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={undefined}
                                        onSelect={handleDateSelect}
                                        modifiers={{ selected: availableDates.map((d) => new Date(d)) }}
                                        modifiersClassNames={{ selected: 'bg-primary text-primary-foreground' }}
                                        disabled={(date) => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            return date < today;
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>

                            {availableDates.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {availableDates.map((dateStr) => (
                                        <span
                                            key={dateStr}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                                        >
                                            {new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            <button
                                                type="button"
                                                onClick={() => removeDate(dateStr)}
                                                className="hover:text-destructive transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Itinerary Section */}
                    <Separator className="my-2" />
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>{t('tours.create.itinerary', 'Itinerary')}</Label>
                            <span className="text-xs text-muted-foreground">
                                {itineraryFields.length}/30
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {t('tours.create.itinerary_desc', 'Add a step-by-step plan for your tour. This helps travelers understand what to expect.')}
                        </p>

                        {itineraryFields.length > 0 && (
                            <div className="space-y-3">
                                {itineraryFields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="relative flex gap-2 p-3 rounded-lg border bg-muted/20"
                                    >
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                                            {index + 1}
                                        </div>

                                        <div className="flex-1 space-y-2 min-w-0">
                                            <Input
                                                placeholder={t('tours.create.itinerary_step_title', 'Step title (e.g. Day 1: Tbilisi)')}
                                                {...register(`itinerary.${index}.title`)}
                                                aria-invalid={!!errors.itinerary?.[index]?.title}
                                            />
                                            {errors.itinerary?.[index]?.title && (
                                                <p className="text-xs text-destructive">{errors.itinerary[index].title?.message}</p>
                                            )}
                                            <Textarea
                                                placeholder={t('tours.create.itinerary_step_desc', 'Describe what happens during this step...')}
                                                className="resize-none min-h-[60px]"
                                                {...register(`itinerary.${index}.description`)}
                                                aria-invalid={!!errors.itinerary?.[index]?.description}
                                            />
                                            {errors.itinerary?.[index]?.description && (
                                                <p className="text-xs text-destructive">{errors.itinerary[index].description?.message}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-0.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleMoveUp(index)}
                                                disabled={index === 0}
                                                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                aria-label={t('tours.create.itinerary_move_up', 'Move up')}
                                            >
                                                <ArrowUp className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === itineraryFields.length - 1}
                                                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                aria-label={t('tours.create.itinerary_move_down', 'Move down')}
                                            >
                                                <ArrowDown className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeStep(index)}
                                                className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                aria-label={t('tours.create.itinerary_remove', 'Remove step')}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddStep}
                            disabled={itineraryFields.length >= 30}
                            className="w-full border-dashed"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('tours.create.itinerary_add_step', 'Add Step')}
                        </Button>
                    </div>

                    <Separator className="my-2" />
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

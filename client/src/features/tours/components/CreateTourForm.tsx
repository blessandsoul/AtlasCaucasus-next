'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Loader2, Upload, X, Check, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";

import { tourService } from '../services/tour.service';
import type { CreateTourInput } from '../types/tour.types';

export const CreateTourForm = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Create and cleanup preview URLs when files change
    useEffect(() => {
        const urls = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);

        // Cleanup function to revoke URLs when component unmounts or files change
        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [selectedFiles]);

    // Schema is defined inside the component to use translations
    const createTourSchema = useMemo(() => z.object({
        title: z.string()
            .min(3, t('tours.create.validation.title_min', 'Title must be at least 3 characters'))
            .max(200, t('tours.create.validation.title_max', 'Title must be at most 200 characters')),
        price: z.coerce.number()
            .min(0, t('tours.create.validation.price_min', 'Price must be 0 or greater')),
        summary: z.string()
            .max(1000, t('tours.create.validation.summary_max', 'Summary must be at most 1000 characters'))
            .optional(),
        currency: z.string()
            .length(3, t('tours.create.validation.currency_length', 'Currency must be 3 characters'))
            .optional()
            .default('GEL'),
        city: z.string()
            .max(100, t('tours.create.validation.city_max', 'City must be at most 100 characters'))
            .optional(),
        startLocation: z.string()
            .max(100, t('tours.create.validation.start_location_max', 'Start location must be at most 100 characters'))
            .optional(),
        originalPrice: z.coerce.number()
            .min(0, t('tours.create.validation.original_price_min', 'Original price must be 0 or greater'))
            .optional(),
        durationMinutes: z.coerce.number().int()
            .min(0, t('tours.create.validation.duration_min', 'Duration must be 0 or greater'))
            .optional(),
        maxPeople: z.coerce.number().int()
            .min(1, t('tours.create.validation.max_people_min', 'Max people must be at least 1'))
            .optional(),
        isInstantBooking: z.boolean().default(false),
        hasFreeCancellation: z.boolean().default(false),
        availabilityType: z.enum(['DAILY', 'WEEKDAYS', 'WEEKENDS', 'SPECIFIC_DATES', 'BY_REQUEST']).default('BY_REQUEST'),
        availableDates: z.array(z.string()).optional(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/, t('tours.create.validation.start_time_format', 'Must be in HH:MM format')).optional().or(z.literal('')),
        itinerary: z.array(z.object({
            title: z.string()
                .min(1, t('tours.create.validation.itinerary_title_required', 'Step title is required'))
                .max(200, t('tours.create.validation.itinerary_title_max', 'Step title must be at most 200 characters')),
            description: z.string()
                .min(1, t('tours.create.validation.itinerary_desc_required', 'Step description is required'))
                .max(2000, t('tours.create.validation.itinerary_desc_max', 'Step description must be at most 2000 characters')),
        })).max(30).optional(),
    }), [t]);

    type TourFormValues = z.infer<typeof createTourSchema>;

    const form = useForm<TourFormValues>({
        resolver: zodResolver(createTourSchema) as any,
        defaultValues: {
            title: "",
            summary: "",
            price: 0,
            currency: 'GEL',
            city: "",
            startLocation: "",
            isInstantBooking: false,
            hasFreeCancellation: false,
            availabilityType: 'BY_REQUEST' as const,
            availableDates: [],
            startTime: '',
            itinerary: [],
        },
    });

    const { fields: itineraryFields, append: appendStep, remove: removeStep, swap: swapSteps } = useFieldArray({
        control: form.control,
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

    const onSubmit = async (data: TourFormValues) => {
        setIsSubmitting(true);
        try {
            // Convert TourFormValues to CreateTourInput (handling date -> string conversion)
            const tourData: CreateTourInput = {
                ...data,
                startTime: data.startTime || undefined,
                availableDates: data.availabilityType === 'SPECIFIC_DATES' && data.availableDates?.length
                    ? data.availableDates
                    : undefined,
                itinerary: data.itinerary?.length ? data.itinerary : undefined,
            };

            // 1. Create Tour
            const createdTourResponse = await tourService.createTour(tourData);
            if (!createdTourResponse.success || !createdTourResponse.data) {
                throw new Error('Failed to create tour');
            }

            const tourId = createdTourResponse.data.id;
            toast.success(t('tours.create.success_message', 'Tour created successfully!'));

            // 2. Upload Images (if selected)
            if (selectedFiles.length > 0) {
                try {
                    await tourService.uploadTourImage(tourId, selectedFiles);
                    toast.success(t('tours.create.image_upload_success', 'Images uploaded successfully!'));
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError);
                    toast.error(t('tours.create.image_upload_error', 'Failed to upload images'));
                }
            }

            // Redirect to the new tour
            router.push(`/explore/tours/${tourId}`);
        } catch (error) {
            console.error('Failed to create tour:', error);
            toast.error(t('tours.create.error_message', 'Failed to create tour'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);

            setSelectedFiles(prevFiles => {
                const updatedFiles = [...prevFiles, ...newFiles];
                if (updatedFiles.length > 10) {
                    toast.error(t('tours.create.max_images_error', 'Maximum 10 images allowed'));
                    return prevFiles;
                }
                return updatedFiles;
            });

            // Reset input value
            e.target.value = '';
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-6xl space-y-8 animate-fade-in">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{t('tours.create.title', 'Create New Tour')}</h1>
                <p className="text-muted-foreground">
                    {t('tours.create.subtitle', 'Fill in the details below to create a new tour listing.')}
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column - Main Details */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Basic Info Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('tours.create.basic_info', 'Basic Information')}</CardTitle>
                                    <CardDescription>
                                        {t('tours.create.basic_info_desc', 'Provide the essential details about your tour.')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('tours.create.tour_title', 'Tour Title')} *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t('tours.create.tour_title_placeholder', 'e.g. Discover Ancient Tbilisi')} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="summary"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('tours.create.summary', 'Summary')}</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder={t('tours.create.summary_placeholder', 'A brief description of your tour...')}
                                                        className="resize-none min-h-[120px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {t('tours.create.summary_desc', 'A short description that appears in search results.')}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('tours.create.region', 'Region / City')}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('tours.create.region_placeholder', 'e.g. Tbilisi')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="startLocation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('tours.create.meeting_point', 'Meeting Point')}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('tours.create.meeting_point_placeholder', 'e.g. Freedom Square')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Details & logistics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('tours.create.logistics', 'Logistics & Details')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="durationMinutes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('tours.create.duration', 'Duration (minutes)')}</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="180" {...field} value={field.value ?? ''} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        {t('tours.create.duration_desc', 'Approximate duration in minutes.')}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="maxPeople"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('tours.create.max_group_size', 'Max Group Size')}</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="12" {...field} value={field.value ?? ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Availability Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="availabilityType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('tours.create.availability_type', 'Availability')}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder={t('tours.create.select_availability', 'Select availability')} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="BY_REQUEST">{t('tour_availability.by_request', 'By request')}</SelectItem>
                                                            <SelectItem value="DAILY">{t('tour_availability.daily', 'Available daily')}</SelectItem>
                                                            <SelectItem value="WEEKDAYS">{t('tour_availability.weekdays', 'Weekdays only')}</SelectItem>
                                                            <SelectItem value="WEEKENDS">{t('tour_availability.weekends', 'Weekends only')}</SelectItem>
                                                            <SelectItem value="SPECIFIC_DATES">{t('tour_availability.specific_dates', 'Specific dates')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        {t('tours.create.availability_type_desc', 'When is this tour available?')}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="startTime"
                                            render={({ field }) => {
                                                const timeDate = (() => {
                                                    if (!field.value) return undefined;
                                                    const [h, m] = field.value.split(':').map(Number);
                                                    const d = new Date();
                                                    d.setHours(h, m, 0, 0);
                                                    return d;
                                                })();

                                                return (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>{t('tours.create.default_start_time', 'Default Start Time')}</FormLabel>
                                                        <TimePicker
                                                            value={timeDate}
                                                            onChange={(date) => {
                                                                const hh = date.getHours().toString().padStart(2, '0');
                                                                const mm = date.getMinutes().toString().padStart(2, '0');
                                                                field.onChange(`${hh}:${mm}`);
                                                            }}
                                                        />
                                                        <FormDescription>
                                                            {t('tours.create.default_start_time_desc', 'Optional default start time (e.g. 09:00).')}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    </div>

                                    {/* Specific Dates Picker — shown only when SPECIFIC_DATES is selected */}
                                    {form.watch('availabilityType') === 'SPECIFIC_DATES' && (
                                        <FormField
                                            control={form.control}
                                            name="availableDates"
                                            render={({ field }) => {
                                                const selectedDates = (field.value || []).map((d: string) => new Date(d));

                                                const handleDateSelect = (date: Date | undefined) => {
                                                    if (!date) return;
                                                    const dateStr = date.toISOString().split('T')[0];
                                                    const current = field.value || [];
                                                    if (current.includes(dateStr)) {
                                                        field.onChange(current.filter((d: string) => d !== dateStr));
                                                    } else {
                                                        field.onChange([...current, dateStr].sort());
                                                    }
                                                };

                                                const removeDate = (dateStr: string) => {
                                                    field.onChange((field.value || []).filter((d: string) => d !== dateStr));
                                                };

                                                return (
                                                    <FormItem>
                                                        <FormLabel>{t('tours.create.available_dates', 'Available Dates')}</FormLabel>
                                                        <div className="space-y-3">
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button
                                                                            variant="outline"
                                                                            className={cn(
                                                                                "w-full justify-start text-left font-normal",
                                                                                !selectedDates.length && "text-muted-foreground"
                                                                            )}
                                                                        >
                                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                                            {selectedDates.length > 0
                                                                                ? t('tours.create.dates_selected', '{{count}} date(s) selected', { count: selectedDates.length })
                                                                                : t('tours.create.pick_dates', 'Pick dates')}
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar
                                                                        mode="single"
                                                                        selected={undefined}
                                                                        onSelect={handleDateSelect}
                                                                        modifiers={{ selected: selectedDates }}
                                                                        modifiersClassNames={{ selected: 'bg-primary text-primary-foreground' }}
                                                                        disabled={(date) => {
                                                                            const today = new Date();
                                                                            today.setHours(0, 0, 0, 0);
                                                                            return date < today;
                                                                        }}
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>

                                                            {selectedDates.length > 0 && (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {(field.value || []).map((dateStr: string) => (
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
                                                        <FormDescription>
                                                            {t('tours.create.available_dates_desc', 'Click dates to add or remove them.')}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    )}

                                    <div className="flex flex-col gap-4 border p-4 rounded-lg bg-muted/20">
                                        <FormField
                                            control={form.control}
                                            name="isInstantBooking"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>
                                                            {t('tours.create.instant_booking', 'Instant Booking')}
                                                        </FormLabel>
                                                        <FormDescription>
                                                            {t('tours.create.instant_booking_desc', 'Allow customers to book without approval.')}
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="hasFreeCancellation"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>
                                                            {t('tours.create.free_cancellation', 'Free Cancellation')}
                                                        </FormLabel>
                                                        <FormDescription>
                                                            {t('tours.create.free_cancellation_desc', 'Offer full refund if cancelled 24h before.')}
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                </CardContent>
                            </Card>

                            {/* Itinerary Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('tours.create.itinerary', 'Itinerary')}</CardTitle>
                                    <CardDescription>
                                        {t('tours.create.itinerary_desc', 'Add a step-by-step plan for your tour. This helps travelers understand what to expect.')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {itineraryFields.length > 0 && (
                                        <div className="space-y-4">
                                            {itineraryFields.map((field, index) => (
                                                <div
                                                    key={field.id}
                                                    className="relative flex gap-3 p-4 rounded-xl border bg-card"
                                                >
                                                    {/* Step number */}
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold mt-0.5">
                                                        {index + 1}
                                                    </div>

                                                    {/* Fields */}
                                                    <div className="flex-1 space-y-3 min-w-0">
                                                        <FormField
                                                            control={form.control}
                                                            name={`itinerary.${index}.title`}
                                                            render={({ field: titleField }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder={t('tours.create.itinerary_step_title', 'Step title (e.g. Day 1: Tbilisi)')}
                                                                            {...titleField}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`itinerary.${index}.description`}
                                                            render={({ field: descField }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Textarea
                                                                            placeholder={t('tours.create.itinerary_step_desc', 'Describe what happens during this step...')}
                                                                            className="resize-none min-h-[80px]"
                                                                            {...descField}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex flex-col gap-1 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveUp(index)}
                                                            disabled={index === 0}
                                                            className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                            aria-label={t('tours.create.itinerary_move_up', 'Move up')}
                                                        >
                                                            <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveDown(index)}
                                                            disabled={index === itineraryFields.length - 1}
                                                            className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                            aria-label={t('tours.create.itinerary_move_down', 'Move down')}
                                                        >
                                                            <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeStep(index)}
                                                            className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                            aria-label={t('tours.create.itinerary_remove', 'Remove step')}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
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

                                    {itineraryFields.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-2">
                                            {t('tours.create.itinerary_empty', 'No itinerary steps yet. Add steps to show travelers what to expect.')}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Media Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('tours.create.gallery', 'Gallery')}</CardTitle>
                                    <CardDescription>
                                        {t('tours.create.gallery_desc', 'Upload photos to showcase your tour.')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer relative">
                                            <Input
                                                type="file"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                multiple
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="p-3 bg-background rounded-full border shadow-sm">
                                                <Upload className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium">{t('tours.create.upload_text', 'Click to upload')}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t('tours.create.upload_subtext', 'PNG, JPG up to 10MB (max 10 images)')}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedFiles.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {selectedFiles.map((file, index) => (
                                                    <div key={`${file.name}-${index}`} className="relative group aspect-square rounded-lg border bg-background overflow-hidden shadow-sm">
                                                        <div className="absolute top-1 right-1 z-10">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile(index)}
                                                                className="p-1 bg-background/80 backdrop-blur-sm rounded-full text-muted-foreground hover:text-destructive transition-colors border shadow-sm"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        {previewUrls[index] && (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img
                                                                src={previewUrls[index]}
                                                                alt={file.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        )}
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1 text-[10px] truncate px-2">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Pricing & Submit */}
                        <div className="space-y-8">
                            <Card className="sticky top-6">
                                <CardHeader>
                                    <CardTitle>{t('tours.create.pricing', 'Pricing')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('tours.create.price', 'Price')} *</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" step="0.01" {...field} className="pl-9" />
                                                        <div className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                                                            {form.watch('currency') === 'USD' ? '$' : form.watch('currency') === 'EUR' ? '€' : '₾'}
                                                        </div>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('tours.create.currency', 'Currency')}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('tours.create.select_currency', 'Select currency')} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="GEL">GEL (₾)</SelectItem>
                                                        <SelectItem value="USD">USD ($)</SelectItem>
                                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="originalPrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('tours.create.original_price', 'Original Price')}</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" step="0.01" {...field} value={field.value ?? ''} className="pl-9" />
                                                        <div className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                                                            {form.watch('currency') === 'USD' ? '$' : form.watch('currency') === 'EUR' ? '€' : '₾'}
                                                        </div>
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    {t('tours.create.original_price_desc', 'Set to show a discount.')}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="pt-4">
                                        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    {t('tours.create.publishing', 'Publishing...')}
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    {t('tours.create.publish_button', 'Publish Tour')}
                                                </>
                                            )}
                                        </Button>
                                        <p className="text-xs text-muted-foreground text-center mt-3">
                                            {t('tours.create.terms', 'By publishing, you agree to our terms of service.')}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
};

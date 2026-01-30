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
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateLocation, useUpdateLocation } from '../hooks/useLocations';
import type { Location, CreateLocationInput, UpdateLocationInput } from '../types/location.types';

const locationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255),
    region: z.string().max(100).optional().nullable(),
    country: z.string().max(100).default('Georgia'),
    latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
    longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
    isActive: z.boolean(),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface EditLocationDialogProps {
    location: Location | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
}

export const EditLocationDialog = ({
    location,
    open,
    onOpenChange,
    mode,
}: EditLocationDialogProps) => {
    const { t } = useTranslation();
    const createLocation = useCreateLocation();
    const updateLocation = useUpdateLocation();

    const isEditing = mode === 'edit';
    const isPending = createLocation.isPending || updateLocation.isPending;

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<LocationFormData>({
        resolver: zodResolver(locationSchema),
        defaultValues: {
            name: '',
            region: '',
            country: 'Georgia',
            latitude: null,
            longitude: null,
            isActive: true,
        },
    });

    useEffect(() => {
        if (open) {
            if (isEditing && location) {
                reset({
                    name: location.name,
                    region: location.region || '',
                    country: location.country,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    isActive: location.isActive,
                });
            } else {
                reset({
                    name: '',
                    region: '',
                    country: 'Georgia',
                    latitude: null,
                    longitude: null,
                    isActive: true,
                });
            }
        }
    }, [location, open, isEditing, reset]);

    const onSubmit = async (data: LocationFormData) => {
        if (isEditing && location) {
            const updateData: UpdateLocationInput = {
                name: data.name,
                region: data.region || undefined,
                country: data.country,
                latitude: data.latitude ?? undefined,
                longitude: data.longitude ?? undefined,
                isActive: data.isActive,
            };

            updateLocation.mutate(
                { id: location.id, data: updateData },
                {
                    onSuccess: () => {
                        onOpenChange(false);
                    },
                }
            );
        } else {
            const createData: CreateLocationInput = {
                name: data.name,
                region: data.region || undefined,
                country: data.country,
                latitude: data.latitude ?? undefined,
                longitude: data.longitude ?? undefined,
            };

            createLocation.mutate(createData, {
                onSuccess: () => {
                    onOpenChange(false);
                },
            });
        }
    };

    const isActive = watch('isActive');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing
                            ? t('admin.locations.edit_title', 'Edit Location')
                            : t('admin.locations.create_title', 'Create Location')}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? t('admin.locations.edit_description', 'Update the location details.')
                            : t('admin.locations.create_description', 'Add a new location to the system.')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('admin.locations.name', 'Name')} *</Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder={t('admin.locations.name_placeholder', 'e.g. Tbilisi')}
                            aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="region">{t('admin.locations.region', 'Region')}</Label>
                            <Input
                                id="region"
                                {...register('region')}
                                placeholder={t('admin.locations.region_placeholder', 'e.g. Tbilisi')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country">{t('admin.locations.country', 'Country')}</Label>
                            <Input
                                id="country"
                                {...register('country')}
                                placeholder={t('admin.locations.country_placeholder', 'e.g. Georgia')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="latitude">{t('admin.locations.latitude', 'Latitude')}</Label>
                            <Input
                                id="latitude"
                                type="number"
                                step="any"
                                {...register('latitude')}
                                placeholder={t('admin.locations.latitude_placeholder', 'e.g. 41.7151')}
                            />
                            {errors.latitude && (
                                <p className="text-sm text-destructive">{errors.latitude.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="longitude">{t('admin.locations.longitude', 'Longitude')}</Label>
                            <Input
                                id="longitude"
                                type="number"
                                step="any"
                                {...register('longitude')}
                                placeholder={t('admin.locations.longitude_placeholder', 'e.g. 44.8271')}
                            />
                            {errors.longitude && (
                                <p className="text-sm text-destructive">{errors.longitude.message}</p>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isActive"
                                    checked={isActive}
                                    onCheckedChange={(checked) => setValue('isActive', checked === true)}
                                />
                                <div className="grid gap-0.5">
                                    <Label htmlFor="isActive" className="cursor-pointer">
                                        {t('admin.locations.is_active', 'Active')}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('admin.locations.is_active_desc', 'Location is available for selection')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending
                                ? isEditing
                                    ? t('common.saving', 'Saving...')
                                    : t('common.creating', 'Creating...')
                                : isEditing
                                    ? t('common.save', 'Save Changes')
                                    : t('admin.locations.add_new', 'Add Location')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

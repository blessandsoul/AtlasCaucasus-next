'use client';

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Car,
  Phone,
  FileText,
  Loader2,
  Save,
  Trash2,
  User,
  Upload,
  ImageIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useMyDriver,
  useUpdateDriver,
  useDeleteDriver,
  useUploadDriverPhotos,
  useDeleteDriverPhoto,
} from '../../hooks/useDrivers';
import { useUploadDriverAvatar } from '../../hooks/useUploadDriverAvatar';
import { useDeleteDriverAvatar } from '../../hooks/useDeleteDriverAvatar';
import { useUploadDriverCover } from '../../hooks/useUploadDriverCover';
import { useDeleteDriverCover } from '../../hooks/useDeleteDriverCover';
import { ProfileAvatarUpload } from '@/components/common/ProfileAvatarUpload';
import { CoverImageUpload } from '@/components/common/CoverImageUpload';
import { getErrorMessage } from '@/lib/utils/error';
import { getMediaUrl } from '@/lib/utils/media';

const driverFormSchema = z.object({
  bio: z.string().max(1000).optional().nullable(),
  vehicleType: z.string().min(2, 'Vehicle type is required').max(50),
  vehicleMake: z.string().min(2, 'Vehicle make is required').max(50),
  vehicleModel: z.string().min(2, 'Vehicle model is required').max(50),
  vehicleCapacity: z.string().or(z.number()).transform((val) => Number(val)),
  licenseNumber: z.string().min(2, 'License number is required').max(50),
  phoneNumber: z.string().min(5, 'Phone number is required').max(20),
});

type DriverFormValues = {
  bio?: string | null;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleCapacity: number | string;
  licenseNumber: string;
  phoneNumber: string;
};

export const DriverProfileTab = () => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: driver, isLoading, error, refetch } = useMyDriver();
  const updateMutation = useUpdateDriver();
  const deleteMutation = useDeleteDriver();
  const uploadPhotosMutation = useUploadDriverPhotos();
  const deletePhotoMutation = useDeleteDriverPhoto();
  const uploadAvatarMutation = useUploadDriverAvatar(driver?.id || '');
  const deleteAvatarMutation = useDeleteDriverAvatar(driver?.id || '');
  const uploadCoverMutation = useUploadDriverCover(driver?.id || '');
  const deleteCoverMutation = useDeleteDriverCover(driver?.id || '');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    values: driver
      ? {
        bio: driver.bio || '',
        vehicleType: driver.vehicleType || '',
        vehicleMake: driver.vehicleMake || '',
        vehicleModel: driver.vehicleModel || '',
        vehicleCapacity: driver.vehicleCapacity || 4,
        licenseNumber: driver.licenseNumber || '',
        phoneNumber: driver.phoneNumber || '',
      }
      : undefined,
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">{t('common.error', 'Error')}</CardTitle>
          <CardDescription>{getErrorMessage(error)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => refetch()}>
            {t('common.try_again', 'Try Again')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!driver) return null;

  const onSubmit = async (data: DriverFormValues) => {
    await updateMutation.mutateAsync({
      id: driver.id,
      data: {
        ...data,
        vehicleCapacity: Number(data.vehicleCapacity),
        bio: data.bio || undefined,
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate(driver.id);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadPhotosMutation.mutate({
        id: driver.id,
        files: Array.from(files),
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    deletePhotoMutation.mutate({
      id: driver.id,
      photoId,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('driver.profile.avatar', 'Profile Photo')}</CardTitle>
          <CardDescription>
            {t('driver.profile.avatar_desc', 'Your primary profile photo shown to customers')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileAvatarUpload
            currentAvatarUrl={driver.avatarUrl}
            firstName={driver.user?.firstName || ''}
            lastName={driver.user?.lastName || ''}
            onUpload={(file) => uploadAvatarMutation.mutate(file)}
            onDelete={() => deleteAvatarMutation.mutate()}
            isUploading={uploadAvatarMutation.isPending}
            isDeleting={deleteAvatarMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Cover Image Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('driver.profile.cover', 'Cover Image')}</CardTitle>
          <CardDescription>
            {t('driver.profile.cover_desc', 'The banner image displayed on your public profile page')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoverImageUpload
            currentCoverUrl={driver.coverUrl}
            onUpload={(file) => uploadCoverMutation.mutate(file)}
            onDelete={() => deleteCoverMutation.mutate()}
            isUploading={uploadCoverMutation.isPending}
            isDeleting={deleteCoverMutation.isPending}
            defaultCoverUrl="/default-covers/driver-cover.jpg"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>{t('driver.profile.title', 'Driver Profile')}</CardTitle>
            <CardDescription>
              {t('driver.profile.subtitle', 'Manage your driver details and vehicle information')}
            </CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              {t('common.edit', 'Edit')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bio">{t('driver.bio', 'Bio')}</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  rows={4}
                  placeholder={t('driver.bio_placeholder', 'Tell us about yourself...')}
                />
                {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
              </div>

              <Separator />

              <h3 className="text-lg font-medium">{t('driver.vehicle_details', 'Vehicle Details')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">{t('driver.vehicle_type', 'Vehicle Type')}</Label>
                  <Input
                    id="vehicleType"
                    {...register('vehicleType')}
                    placeholder="e.g. Sedan, Minivan"
                  />
                  {errors.vehicleType && (
                    <p className="text-sm text-destructive">{errors.vehicleType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleCapacity">{t('driver.vehicle_capacity', 'Capacity')}</Label>
                  <Input id="vehicleCapacity" type="number" {...register('vehicleCapacity')} />
                  {errors.vehicleCapacity && (
                    <p className="text-sm text-destructive">{errors.vehicleCapacity.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleMake">{t('driver.vehicle_make', 'Make')}</Label>
                  <Input id="vehicleMake" {...register('vehicleMake')} placeholder="e.g. Toyota" />
                  {errors.vehicleMake && (
                    <p className="text-sm text-destructive">{errors.vehicleMake.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleModel">{t('driver.vehicle_model', 'Model')}</Label>
                  <Input id="vehicleModel" {...register('vehicleModel')} placeholder="e.g. Camry" />
                  {errors.vehicleModel && (
                    <p className="text-sm text-destructive">{errors.vehicleModel.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">{t('driver.license_number', 'License Plate')}</Label>
                  <Input id="licenseNumber" {...register('licenseNumber')} placeholder="AB-123-CD" />
                  {errors.licenseNumber && (
                    <p className="text-sm text-destructive">{errors.licenseNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">{t('driver.phone_number', 'Phone Number')}</Label>
                  <Input id="phoneNumber" {...register('phoneNumber')} placeholder="+995..." />
                  {errors.phoneNumber && (
                    <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.saving', 'Saving...')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('common.save', 'Save Changes')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('driver.bio', 'Bio')}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {driver.bio || t('driver.no_bio', 'No bio provided.')}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Car className="h-4 w-4" />
                    <span className="text-sm">{t('driver.vehicle', 'Vehicle')}</span>
                  </div>
                  <p className="font-medium">
                    {driver.vehicleMake} {driver.vehicleModel} ({driver.vehicleType})
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{t('driver.vehicle_capacity', 'Capacity')}</span>
                  </div>
                  <p className="font-medium">
                    {driver.vehicleCapacity} {t('driver.passengers', 'passengers')}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{t('driver.license_number', 'License Plate')}</span>
                  </div>
                  <p className="font-medium">{driver.licenseNumber}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{t('driver.phone_number', 'Phone Number')}</span>
                  </div>
                  <p className="font-medium">{driver.phoneNumber}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {t('driver.photos.title', 'Photos')}
            </CardTitle>
            <CardDescription>
              {t('driver.photos.subtitle', 'Upload photos of yourself and your vehicle')}
            </CardDescription>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhotosMutation.isPending}
            >
              {uploadPhotosMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.uploading', 'Uploading...')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('common.upload_photos', 'Upload Photos')}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {driver.photos && driver.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {driver.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border"
                >
                  <img
                    src={getMediaUrl(photo.url)}
                    alt={photo.originalName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeletePhoto(photo.id)}
                      disabled={deletePhotoMutation.isPending}
                    >
                      {deletePhotoMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('driver.photos.no_photos', 'No photos uploaded yet')}</p>
              <p className="text-sm mt-1">
                {t('driver.photos.upload_hint', 'Upload photos to showcase yourself and your vehicle')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">{t('common.danger_zone', 'Danger Zone')}</CardTitle>
          <CardDescription>
            {t('driver.delete_warning', 'Irreversible actions for your driver profile')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <div>
              <p className="font-medium">{t('driver.delete_profile', 'Delete Driver Profile')}</p>
              <p className="text-sm text-muted-foreground">
                {t(
                  'driver.delete_desc',
                  'Once deleted, your driver profile and all associated data will be removed.'
                )}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="shrink-0">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete', 'Delete')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('driver.delete_confirm_title', 'Are you sure?')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      'driver.delete_confirm_desc',
                      'This action cannot be undone. Your driver profile will be permanently removed.'
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('common.deleting', 'Deleting...')}
                      </>
                    ) : (
                      t('common.delete', 'Delete')
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

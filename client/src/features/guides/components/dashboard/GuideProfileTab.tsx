'use client';

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Languages,
  Clock,
  Phone,
  Loader2,
  Save,
  Trash2,
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
  useMyGuide,
  useUpdateGuide,
  useDeleteGuide,
  useUploadGuidePhotos,
  useDeleteGuidePhoto,
} from '../../hooks/useGuides';
import { useUploadGuideAvatar } from '../../hooks/useUploadGuideAvatar';
import { useDeleteGuideAvatar } from '../../hooks/useDeleteGuideAvatar';
import { ProfileAvatarUpload } from '@/components/common/ProfileAvatarUpload';
import { getErrorMessage } from '@/lib/utils/error';
import { getMediaUrl } from '@/lib/utils/media';

const guideFormSchema = z.object({
  bio: z.string().max(1000).optional().nullable(),
  yearsOfExperience: z.coerce.number().min(0, 'Must be at least 0').max(70),
  languages: z.string().min(2, 'Languages are required').max(100),
  phoneNumber: z.string().min(5, 'Phone number is required').max(20),
});

type GuideFormValues = {
  bio?: string | null;
  yearsOfExperience: number | string;
  languages: string;
  phoneNumber: string;
};

export const GuideProfileTab = () => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: guide, isLoading, error, refetch } = useMyGuide();
  const updateMutation = useUpdateGuide();
  const deleteMutation = useDeleteGuide();
  const uploadPhotosMutation = useUploadGuidePhotos();
  const deletePhotoMutation = useDeleteGuidePhoto();
  const uploadAvatarMutation = useUploadGuideAvatar(guide?.id || '');
  const deleteAvatarMutation = useDeleteGuideAvatar(guide?.id || '');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<GuideFormValues>({
    resolver: zodResolver(guideFormSchema),
    values: guide
      ? {
        bio: guide.bio || '',
        yearsOfExperience: guide.yearsOfExperience || 0,
        languages: Array.isArray(guide.languages)
          ? guide.languages.join(', ')
          : typeof guide.languages === 'string'
            ? guide.languages
            : '',
        phoneNumber: guide.phoneNumber || '',
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

  if (!guide) return null;

  const onSubmit = async (data: GuideFormValues) => {
    const apiData = {
      ...data,
      yearsOfExperience: Number(data.yearsOfExperience),
      languages: data.languages
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      bio: data.bio || undefined,
    };

    await updateMutation.mutateAsync({
      id: guide.id,
      data: apiData,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate(guide.id);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadPhotosMutation.mutate({
        id: guide.id,
        files: Array.from(files),
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    deletePhotoMutation.mutate({
      id: guide.id,
      photoId,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('guide.profile.avatar', 'Profile Photo')}</CardTitle>
          <CardDescription>
            {t('guide.profile.avatar_desc', 'Your primary profile photo shown to customers')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileAvatarUpload
            currentAvatarUrl={guide.avatarUrl}
            firstName={guide.user?.firstName || ''}
            lastName={guide.user?.lastName || ''}
            onUpload={(file) => uploadAvatarMutation.mutate(file)}
            onDelete={() => deleteAvatarMutation.mutate()}
            isUploading={uploadAvatarMutation.isPending}
            isDeleting={deleteAvatarMutation.isPending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>{t('guide.profile.title', 'Guide Profile')}</CardTitle>
            <CardDescription>
              {t('guide.profile.subtitle', 'Manage your guide details and experience')}
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
                <Label htmlFor="bio">{t('guide.bio', 'Bio')}</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  rows={4}
                  placeholder={t('guide.bio_placeholder', 'Tell us about your experience...')}
                />
                {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">
                    {t('guide.experience', 'Years of Experience')}
                  </Label>
                  <Input id="yearsOfExperience" type="number" {...register('yearsOfExperience')} />
                  {errors.yearsOfExperience && (
                    <p className="text-sm text-destructive">{errors.yearsOfExperience.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="languages">
                    {t('guide.languages', 'Languages (comma separated)')}
                  </Label>
                  <Input
                    id="languages"
                    {...register('languages')}
                    placeholder="English, Georgian, Russian"
                  />
                  {errors.languages && (
                    <p className="text-sm text-destructive">{errors.languages.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">{t('guide.phone_number', 'Phone Number')}</Label>
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
                <p className="text-sm text-muted-foreground">{t('guide.bio', 'Bio')}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {guide.bio || t('guide.no_bio', 'No bio provided.')}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{t('guide.experience', 'Experience')}</span>
                  </div>
                  <p className="font-medium">
                    {guide.yearsOfExperience} {t('common.years', 'years')}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Languages className="h-4 w-4" />
                    <span className="text-sm">{t('guide.languages', 'Languages')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(Array.isArray(guide.languages)
                      ? guide.languages
                      : typeof guide.languages === 'string'
                        ? (guide.languages as string).split(',')
                        : []
                    )?.map((lang) => (
                      <span
                        key={lang}
                        className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      >
                        {lang.trim()}
                      </span>
                    )) || '-'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{t('guide.phone_number', 'Phone Number')}</span>
                  </div>
                  <p className="font-medium">{guide.phoneNumber}</p>
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
              {t('guide.photos.title', 'Photos')}
            </CardTitle>
            <CardDescription>
              {t('guide.photos.subtitle', 'Upload photos to showcase your experience')}
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
          {guide.photos && guide.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {guide.photos.map((photo) => (
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
              <p>{t('guide.photos.no_photos', 'No photos uploaded yet')}</p>
              <p className="text-sm mt-1">
                {t('guide.photos.upload_hint', 'Upload photos to showcase your experience and tours')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">{t('common.danger_zone', 'Danger Zone')}</CardTitle>
          <CardDescription>
            {t('guide.delete_warning', 'Irreversible actions for your guide profile')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <div>
              <p className="font-medium">{t('guide.delete_profile', 'Delete Guide Profile')}</p>
              <p className="text-sm text-muted-foreground">
                {t(
                  'guide.delete_desc',
                  'Once deleted, your guide profile and all associated data will be removed.'
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
                  <AlertDialogTitle>{t('guide.delete_confirm_title', 'Are you sure?')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      'guide.delete_confirm_desc',
                      'This action cannot be undone. Your guide profile will be permanently removed.'
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

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Globe,
  Phone,
  FileText,
  Loader2,
  Save,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Upload,
  ImageIcon,
  X,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useMyCompany,
  useUpdateCompany,
  useDeleteCompany,
  useUploadCompanyPhotos,
  useDeleteCompanyPhoto,
} from '@/features/companies/hooks/useCompanies';
import { CompanyLogoUpload } from '@/features/companies/components/CompanyLogoUpload';
import { ROUTES } from '@/lib/constants/routes';
import { formatDate } from '@/lib/utils/format';
import { getErrorMessage } from '@/lib/utils/error';
import { getMediaUrl } from '@/lib/utils/media';

const updateCompanySchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(255),
  description: z.string().max(2000).optional().nullable(),
  registrationNumber: z.string().max(100).optional().nullable(),
  websiteUrl: z.string().url('Invalid URL').max(512).optional().nullable().or(z.literal('')),
  phoneNumber: z.string().max(20).optional().nullable(),
});

type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;

export default function CompanyManagementPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { data: company, isLoading, error, refetch } = useMyCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();
  const uploadPhotosMutation = useUploadCompanyPhotos();
  const deletePhotoMutation = useDeleteCompanyPhoto();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateCompanyFormData>({
    resolver: zodResolver(updateCompanySchema),
    values: company
      ? {
        companyName: company.companyName,
        description: company.description || '',
        registrationNumber: company.registrationNumber || '',
        websiteUrl: company.websiteUrl || '',
        phoneNumber: company.phoneNumber || '',
      }
      : undefined,
  });

  // Redirect if not authenticated or not a company
  if (!isAuthenticated || !user?.roles?.includes('COMPANY')) {
    router.push(ROUTES.DASHBOARD);
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl space-y-8 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('company.management.title', 'Company Management')}
          </h2>
          <p className="text-muted-foreground">
            {t('company.management.subtitle', 'Manage your company profile and settings')}
          </p>
        </div>
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
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-4xl space-y-8 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('company.management.title', 'Company Management')}
          </h2>
          <p className="text-muted-foreground">
            {t('company.management.no_company', "You don't have a company profile yet")}
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: UpdateCompanyFormData) => {
    await updateMutation.mutateAsync({
      id: company.id,
      data: {
        companyName: data.companyName,
        description: data.description || undefined,
        registrationNumber: data.registrationNumber || undefined,
        websiteUrl: data.websiteUrl || undefined,
        phoneNumber: data.phoneNumber || undefined,
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate(company.id);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    uploadPhotosMutation.mutate(
      { id: company.id, files: Array.from(files) },
      {
        onSuccess: () => {
          if (photoInputRef.current) {
            photoInputRef.current.value = '';
          }
        },
      }
    );
  };

  const handlePhotoDelete = (photoId: string) => {
    deletePhotoMutation.mutate({ id: company.id, photoId });
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('company.management.title', 'Company Management')}
          </h2>
          <p className="text-muted-foreground">
            {t('company.management.subtitle', 'Manage your company profile and settings')}
          </p>
        </div>
        <Badge
          variant={company.isVerified ? 'outline' : 'secondary'}
          className={
            company.isVerified
              ? 'text-green-600 border-green-200 bg-green-50'
              : 'text-amber-600 bg-amber-50'
          }
        >
          {company.isVerified ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              {t('common.verified', 'Verified')}
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5 mr-1" />
              {t('company.pending_verification', 'Pending Verification')}
            </>
          )}
        </Badge>
      </div>

      {/* Company Info Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>{t('company.management.company_info', 'Company Information')}</CardTitle>
          </div>
          {!isEditing && (
            <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Logo Upload - Always visible */}
          <div className="mb-6">
            <CompanyLogoUpload
              companyId={company.id}
              currentLogoUrl={company.logoUrl}
              size="lg"
            />
          </div>

          <Separator className="mb-6" />

          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">{t('company.name', 'Company Name')} *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    {...register('companyName')}
                    className="pl-9"
                    placeholder={t('company.name_placeholder', 'Enter company name')}
                  />
                </div>
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('company.description', 'Description')}</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  rows={4}
                  placeholder={t('company.description_placeholder', 'Describe your company...')}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Registration Number */}
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">
                    {t('company.registration_number', 'Registration Number')}
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="registrationNumber"
                      {...register('registrationNumber')}
                      className="pl-9"
                      placeholder={t('company.registration_placeholder', 'e.g., 123456789')}
                    />
                  </div>
                  {errors.registrationNumber && (
                    <p className="text-sm text-destructive">{errors.registrationNumber.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">{t('company.phone', 'Phone Number')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      {...register('phoneNumber')}
                      className="pl-9"
                      placeholder="+995 555 00 00 00"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Website URL */}
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">{t('company.website', 'Website')}</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="websiteUrl"
                    {...register('websiteUrl')}
                    className="pl-9"
                    placeholder="https://yourcompany.com"
                  />
                </div>
                {errors.websiteUrl && (
                  <p className="text-sm text-destructive">{errors.websiteUrl.message}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
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
              {/* View Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('company.name', 'Company Name')}</p>
                  <p className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {company.companyName}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t('company.registration_number', 'Registration Number')}
                  </p>
                  <p className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {company.registrationNumber || '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('company.phone', 'Phone Number')}</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {company.phoneNumber || '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('company.website', 'Website')}</p>
                  {company.websiteUrl ? (
                    <a
                      href={company.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium flex items-center gap-2 text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      {company.websiteUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />-
                    </p>
                  )}
                </div>
              </div>

              {company.description && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t('company.description', 'Description')}
                  </p>
                  <p className="text-sm leading-relaxed">{company.description}</p>
                </div>
              )}

              <Separator />

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">{t('common.created', 'Created')}:</span>{' '}
                  {formatDate(company.createdAt)}
                </div>
                <div>
                  <span className="font-medium">{t('common.updated', 'Updated')}:</span>{' '}
                  {formatDate(company.updatedAt)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {t('company.photos.title', 'Company Photos')}
          </CardTitle>
          <CardDescription>
            {t('company.photos.description', 'Upload photos to showcase your company')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              multiple
              className="hidden"
              id="company-photo-upload"
            />
            <Button
              variant="outline"
              onClick={() => photoInputRef.current?.click()}
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
            <span className="text-sm text-muted-foreground">
              {t('company.photos.supported_formats', 'Supports JPG, PNG, WebP (max 5MB each)')}
            </span>
          </div>

          {/* Photos Grid */}
          {company.images && company.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {company.images.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden border group"
                >
                  <img
                    src={getMediaUrl(photo.url)}
                    alt={photo.originalName}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handlePhotoDelete(photo.id)}
                    disabled={deletePhotoMutation.isPending}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p>{t('company.photos.no_photos', 'No photos uploaded yet')}</p>
              <p className="text-sm">
                {t('company.photos.upload_hint', 'Upload photos to showcase your company')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">{t('company.danger_zone', 'Danger Zone')}</CardTitle>
          <CardDescription>
            {t('company.danger_zone_desc', 'Irreversible actions for your company')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <div>
              <p className="font-medium">{t('company.delete_company', 'Delete Company')}</p>
              <p className="text-sm text-muted-foreground">
                {t(
                  'company.delete_company_warning',
                  'Once deleted, your company and all associated data will be removed.'
                )}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="shrink-0">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('company.delete', 'Delete Company')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t(
                      'company.delete_dialog.title',
                      'Are you sure you want to delete your company?'
                    )}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      'company.delete_dialog.description',
                      'This action cannot be undone. Your company profile, tours, and all associated data will be permanently removed.'
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
                      t('company.delete', 'Delete Company')
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
}

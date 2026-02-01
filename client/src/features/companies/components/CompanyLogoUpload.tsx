'use client';

import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Camera, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useUploadCompanyLogo } from '../hooks/useCompanies';
import { getMediaUrl } from '@/lib/utils/media';
import { cn } from '@/lib/utils';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface CompanyLogoUploadProps {
  companyId: string;
  currentLogoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CompanyLogoUpload = ({
  companyId,
  currentLogoUrl,
  size = 'md',
  className,
}: CompanyLogoUploadProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useUploadCompanyLogo();

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return t('company.logo.invalid_type', 'Only JPEG, PNG, and WebP images are allowed');
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('company.logo.file_too_large', 'File size must be less than 5MB');
    }
    return null;
  }, [t]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload immediately
    uploadMutation.mutate(
      { companyId, file },
      {
        onSuccess: () => {
          // Revoke preview URL after successful upload
          URL.revokeObjectURL(objectUrl);
          setPreviewUrl(null);
        },
        onError: () => {
          // Revoke preview URL on error
          URL.revokeObjectURL(objectUrl);
          setPreviewUrl(null);
        },
      }
    );

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [companyId, uploadMutation, validateFile]);

  const handleClearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
  }, [previewUrl]);

  const displayUrl = previewUrl || (currentLogoUrl ? getMediaUrl(currentLogoUrl) : null);
  const isUploading = uploadMutation.isPending;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Logo Preview */}
        <div
          className={cn(
            'relative rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center bg-muted/30',
            sizeClasses[size],
            isUploading && 'opacity-50'
          )}
        >
          {displayUrl ? (
            <>
              <img
                src={displayUrl}
                alt={t('company.logo.alt', 'Company logo')}
                className="w-full h-full object-cover"
              />
              {previewUrl && !isUploading && (
                <button
                  type="button"
                  onClick={handleClearPreview}
                  className="absolute top-1 right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </>
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground/50" />
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-2">
          <div>
            <h4 className="text-sm font-medium">
              {t('company.logo.title', 'Company Logo')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t('company.logo.hint', 'Recommended: 200x200px or larger, square aspect ratio')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              id="company-logo-upload"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Camera className="h-4 w-4 mr-2" />
              {currentLogoUrl
                ? t('company.logo.change', 'Change Logo')
                : t('company.logo.upload', 'Upload Logo')
              }
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('company.logo.formats', 'JPEG, PNG, or WebP (max 5MB)')}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

'use client';

import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useUploadAvatar } from '../hooks/useUploadAvatar';
import { useDeleteAvatar } from '../hooks/useDeleteAvatar';
import { getMediaUrl } from '@/lib/utils/media';
import { cn } from '@/lib/utils';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  validateImageFile,
} from '@/features/media';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AvatarUpload = ({
  currentAvatarUrl,
  firstName,
  lastName,
  size = 'lg',
  className,
}: AvatarUploadProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useUploadAvatar();
  const deleteMutation = useDeleteAvatar();

  const sizeClasses = {
    sm: 'h-16 w-16 text-xl',
    md: 'h-20 w-20 text-2xl',
    lg: 'h-24 w-24 text-3xl',
  };

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);

      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(
          t(
            validation.error?.includes('type')
              ? 'profile.avatar.invalid_type'
              : 'profile.avatar.file_too_large',
            validation.error
          )
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload immediately
      uploadMutation.mutate(file, {
        onSuccess: () => {
          URL.revokeObjectURL(objectUrl);
          setPreviewUrl(null);
        },
        onError: () => {
          URL.revokeObjectURL(objectUrl);
          setPreviewUrl(null);
        },
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [uploadMutation, t]
  );

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  const displayUrl = previewUrl || (currentAvatarUrl ? getMediaUrl(currentAvatarUrl) : null);
  const isUploading = uploadMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isLoading = isUploading || isDeleting;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-4">
        {/* Avatar Preview */}
        <div
          className={cn(
            'relative rounded-full overflow-hidden border-2 flex items-center justify-center bg-primary/10',
            sizeClasses[size],
            isLoading && 'opacity-50'
          )}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={t('profile.avatar.alt', 'User avatar')}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-bold text-primary">{initials}</span>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              id="avatar-upload"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Camera className="h-4 w-4 mr-2" />
              {currentAvatarUrl
                ? t('profile.avatar.change', 'Change Photo')
                : t('profile.avatar.upload', 'Upload Photo')}
            </Button>
            {currentAvatarUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {t('profile.avatar.formats', 'JPEG, PNG, or WebP (max 5MB)')}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

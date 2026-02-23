'use client';

import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Loader2, Trash2, ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getMediaUrl } from '@/lib/utils/media';
import { cn } from '@/lib/utils';
import {
  ALLOWED_IMAGE_TYPES,
  validateImageFile,
} from '@/features/media';

interface CoverImageUploadProps {
  currentCoverUrl: string | null;
  onUpload: (file: File) => void;
  onDelete: () => void;
  isUploading: boolean;
  isDeleting: boolean;
  defaultCoverUrl?: string;
  className?: string;
}

export const CoverImageUpload = ({
  currentCoverUrl,
  onUpload,
  onDelete,
  isUploading,
  isDeleting,
  defaultCoverUrl,
  className,
}: CoverImageUploadProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isLoading = isUploading || isDeleting;

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
              ? 'profile.cover.invalid_type'
              : 'profile.cover.file_too_large',
            validation.error || ''
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

      // Upload the file
      onUpload(file);

      // Cleanup preview after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
      }, 2000);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onUpload, t]
  );

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    onDelete();
    setShowDeleteConfirm(false);
  }, [onDelete]);

  const resolvedUrl =
    previewUrl ||
    (currentCoverUrl ? getMediaUrl(currentCoverUrl) : null);
  const displayUrl = resolvedUrl || defaultCoverUrl || null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Cover Preview */}
      <div
        className={cn(
          'relative w-full h-48 md:h-56 rounded-xl overflow-hidden border-2 border-dashed bg-muted/30 group cursor-pointer',
          isLoading && 'opacity-50 pointer-events-none'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={t('profile.cover.alt', 'Cover image')}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">{t('profile.cover.placeholder', 'Click to upload a cover image')}</p>
          </div>
        )}

        {/* Hover overlay */}
        {!isLoading && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-2 text-white">
              <Camera className="h-6 w-6" />
              <span className="text-sm font-medium">
                {currentCoverUrl
                  ? t('profile.cover.change', 'Change Cover')
                  : t('profile.cover.upload', 'Upload Cover')}
              </span>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {currentCoverUrl
            ? t('profile.cover.change', 'Change Cover')
            : t('profile.cover.upload', 'Upload Cover')}
        </Button>
        {currentCoverUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isLoading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('profile.cover.remove', 'Remove')}
          </Button>
        )}
        <p className="text-xs text-muted-foreground ml-auto">
          {t('profile.cover.formats', 'JPEG, PNG, or WebP (max 5MB)')}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('profile.cover.delete_title', 'Remove cover image?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.cover.delete_description', 'This action cannot be undone. The cover image will be permanently removed.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {t('profile.cover.confirm_remove', 'Remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

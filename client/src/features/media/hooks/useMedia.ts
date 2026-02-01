'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { mediaService } from '../services/media.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { MediaEntityType } from '../types/media.types';

export const useMedia = (entityType: MediaEntityType, entityId: string) => {
  return useQuery({
    queryKey: ['media', entityType, entityId],
    queryFn: () => mediaService.getMedia(entityType, entityId),
    enabled: !!entityId,
  });
};

export const useUploadMedia = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      file,
    }: {
      entityType: MediaEntityType;
      entityId: string;
      file: File;
    }) => mediaService.uploadMedia(entityType, entityId, file),
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['media', entityType, entityId] });
      toast.success(t('media.upload_success', 'File uploaded successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useBatchUpload = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      files,
    }: {
      entityType: MediaEntityType;
      entityId: string;
      files: File[];
    }) => mediaService.batchUpload(entityType, entityId, files),
    onSuccess: (result, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['media', entityType, entityId] });

      if (result.failed.length > 0) {
        toast.warning(
          t('media.batch_partial', '{{uploaded}} files uploaded, {{failed}} failed', {
            uploaded: result.uploaded.length,
            failed: result.failed.length,
          })
        );
      } else {
        toast.success(
          t('media.batch_success', '{{count}} files uploaded successfully', {
            count: result.uploaded.length,
          })
        );
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      id,
      entityType,
      entityId,
    }: {
      id: string;
      entityType: MediaEntityType;
      entityId: string;
    }) => mediaService.deleteMedia(id),
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['media', entityType, entityId] });
      toast.success(t('media.delete_success', 'File deleted successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

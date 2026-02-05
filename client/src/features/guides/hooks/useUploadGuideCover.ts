'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { guideService } from '../services/guide.service';
import { getFileUploadErrorMessage } from '@/features/media';

export const useUploadGuideCover = (guideId: string) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: (file: File) => {
            if (!guideId) {
                throw new Error('Guide ID is required');
            }
            return guideService.uploadCover(guideId, file);
        },
        onSuccess: () => {
            // Invalidate guide queries to refetch with new cover
            queryClient.invalidateQueries({ queryKey: ['guide', guideId] });
            queryClient.invalidateQueries({ queryKey: ['my-guide'] });
            queryClient.invalidateQueries({ queryKey: ['guides'] });
            toast.success(t('profile.cover.upload_success', 'Cover image uploaded successfully'));
        },
        onError: (error) => {
            toast.error(getFileUploadErrorMessage(error));
        },
    });
};

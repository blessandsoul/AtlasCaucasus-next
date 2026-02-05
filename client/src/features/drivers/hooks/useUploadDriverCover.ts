'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { driverService } from '../services/driver.service';
import { getFileUploadErrorMessage } from '@/features/media';

export const useUploadDriverCover = (driverId: string) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: (file: File) => {
            if (!driverId) {
                throw new Error('Driver ID is required');
            }
            return driverService.uploadCover(driverId, file);
        },
        onSuccess: () => {
            // Invalidate driver queries to refetch with new cover
            queryClient.invalidateQueries({ queryKey: ['driver', driverId] });
            queryClient.invalidateQueries({ queryKey: ['my-driver'] });
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            toast.success(t('profile.cover.upload_success', 'Cover image uploaded successfully'));
        },
        onError: (error) => {
            toast.error(getFileUploadErrorMessage(error));
        },
    });
};

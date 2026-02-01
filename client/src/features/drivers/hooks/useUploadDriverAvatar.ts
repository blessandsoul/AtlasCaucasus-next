'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { driverService } from '../services/driver.service';
import { getErrorMessage } from '@/lib/utils/error';

export const useUploadDriverAvatar = (driverId: string) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: (file: File) => {
            if (!driverId) {
                throw new Error('Driver ID is required');
            }
            return driverService.uploadAvatar(driverId, file);
        },
        onSuccess: () => {
            // Invalidate driver queries to refetch with new avatar
            queryClient.invalidateQueries({ queryKey: ['driver', driverId] });
            queryClient.invalidateQueries({ queryKey: ['my-driver'] });
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            toast.success(t('profile.avatar.upload_success', 'Avatar uploaded successfully'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

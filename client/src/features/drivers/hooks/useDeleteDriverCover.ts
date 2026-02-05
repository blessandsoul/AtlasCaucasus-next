'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { mediaService } from '@/features/media';
import { getErrorMessage } from '@/lib/utils/error';

export const useDeleteDriverCover = (driverId: string) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async () => {
            if (!driverId) {
                throw new Error('Driver ID is required');
            }
            // Get cover media for driver
            const media = await mediaService.getMedia('driver-cover', driverId);
            // Delete all cover media (should be only one)
            for (const item of media) {
                await mediaService.deleteMedia(item.id);
            }
        },
        onSuccess: () => {
            // Invalidate driver queries to refetch without cover
            queryClient.invalidateQueries({ queryKey: ['driver', driverId] });
            queryClient.invalidateQueries({ queryKey: ['my-driver'] });
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            toast.success(t('profile.cover.delete_success', 'Cover image removed successfully'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

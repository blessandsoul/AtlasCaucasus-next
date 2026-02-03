'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { mediaService } from '@/features/media';
import { getErrorMessage } from '@/lib/utils/error';

export const useDeleteGuideAvatar = (guideId: string) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async () => {
            if (!guideId) {
                throw new Error('Guide ID is required');
            }
            // Get avatar media for guide (using guide entityType)
            const media = await mediaService.getMedia('guide', guideId);
            // Delete all avatar media (should be only one)
            for (const item of media) {
                await mediaService.deleteMedia(item.id);
            }
        },
        onSuccess: () => {
            // Invalidate guide queries to refetch without avatar
            queryClient.invalidateQueries({ queryKey: ['guide', guideId] });
            queryClient.invalidateQueries({ queryKey: ['my-guide'] });
            queryClient.invalidateQueries({ queryKey: ['guides'] });
            toast.success(t('profile.avatar.delete_success', 'Avatar removed successfully'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

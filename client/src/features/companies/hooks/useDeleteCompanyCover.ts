'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { mediaService } from '@/features/media';
import { getErrorMessage } from '@/lib/utils/error';

export const useDeleteCompanyCover = (companyId: string) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async () => {
            if (!companyId) {
                throw new Error('Company ID is required');
            }
            // Get cover media for company
            const media = await mediaService.getMedia('company-cover', companyId);
            // Delete all cover media (should be only one)
            for (const item of media) {
                await mediaService.deleteMedia(item.id);
            }
        },
        onSuccess: () => {
            // Invalidate company queries to refetch without cover
            queryClient.invalidateQueries({ queryKey: ['company', companyId] });
            queryClient.invalidateQueries({ queryKey: ['my-company'] });
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success(t('profile.cover.delete_success', 'Cover image removed successfully'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

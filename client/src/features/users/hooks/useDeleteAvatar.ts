'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUser } from '@/features/auth/store/authSlice';
import { mediaService } from '@/features/media';
import { getErrorMessage } from '@/lib/utils/error';

export const useDeleteAvatar = () => {
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const user = useAppSelector((state) => state.auth.user);

    return useMutation({
        mutationFn: async () => {
            if (!user?.id) {
                throw new Error('User not authenticated');
            }
            // Delete all media for user entity (avatar)
            const media = await mediaService.getMedia('user', user.id);
            for (const item of media) {
                await mediaService.deleteMedia(item.id);
            }
        },
        onSuccess: () => {
            // Update Redux state to clear avatar URL
            dispatch(updateUser({ avatarUrl: null }));
            // Invalidate user queries
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
            toast.success(t('profile.avatar.delete_success', 'Avatar removed successfully'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

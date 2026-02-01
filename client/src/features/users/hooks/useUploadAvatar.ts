'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUser } from '@/features/auth/store/authSlice';
import { userService } from '../services/user.service';
import { getFileUploadErrorMessage } from '@/features/media';

export const useUploadAvatar = () => {
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const user = useAppSelector((state) => state.auth.user);

    return useMutation({
        mutationFn: (file: File) => {
            if (!user?.id) {
                throw new Error('User not authenticated');
            }
            return userService.uploadAvatar(user.id, file);
        },
        onSuccess: (data) => {
            // Update Redux state with new avatar URL
            dispatch(updateUser({ avatarUrl: data.avatarUrl }));
            // Invalidate user queries
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
            toast.success(t('profile.avatar.upload_success', 'Avatar uploaded successfully'));
        },
        onError: (error) => {
            toast.error(getFileUploadErrorMessage(error));
        },
    });
};

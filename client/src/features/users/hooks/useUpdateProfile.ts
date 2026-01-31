'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUser } from '@/features/auth/store/authSlice';
import { userService, UpdateProfileData } from '../services/user.service';

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const user = useAppSelector((state) => state.auth.user);

    return useMutation({
        mutationFn: (data: UpdateProfileData) => {
            if (!user?.id) {
                throw new Error('User not authenticated');
            }
            return userService.updateProfile(user.id, data);
        },
        onSuccess: (updatedUser) => {
            // Update Redux state with new user data
            dispatch(updateUser(updatedUser));
            // Invalidate current user query
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            toast.success(t('profile.update_success', 'Profile updated successfully'));
        },
        onError: (error: Error) => {
            toast.error(error.message || t('common.error', 'An error occurred'));
        },
    });
};

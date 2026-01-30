'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/user.service';
import type { IUser } from '@/features/auth/types/auth.types';

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: Partial<IUser> }) =>
            userService.updateUser(userId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('admin.users.updated', 'User updated successfully'));
        },
        onError: (error: any) => {
            toast.error(error.message || t('common.error', 'An error occurred'));
        },
    });
};

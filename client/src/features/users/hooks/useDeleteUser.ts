'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/user.service';

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: (userId: string) => userService.deleteUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('admin.users.deleted', 'User deleted successfully'));
        },
        onError: (error: any) => {
            toast.error(error.message || t('common.error', 'An error occurred'));
        },
    });
};

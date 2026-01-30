'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/user.service';

export const useRemoveUserRole = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) =>
            userService.removeUserRole(userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('admin.users.roleRemoved', 'User role removed successfully'));
        },
        onError: (error: any) => {
            toast.error(error.message || t('common.error', 'An error occurred'));
        },
    });
};

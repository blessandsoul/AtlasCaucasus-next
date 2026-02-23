'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/user.service';
import { getErrorMessage } from '@/lib/utils/error';

export const useUnlockUser = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => userService.unlockUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('admin.users.unlocked'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

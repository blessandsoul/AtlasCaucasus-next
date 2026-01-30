'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { getErrorMessage } from '@/lib/utils/error';
import type { CreateUserInput } from '@/features/auth/types/auth.types';

export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateUserInput & { role?: string }) => {
            const response = await apiClient.post(API_ENDPOINTS.USERS.CREATE, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User created successfully');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

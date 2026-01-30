'use client';

import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import type { PaginationParams } from '@/lib/api/api.types';

export const useUsers = (params: PaginationParams = {}) => {
    return useQuery({
        queryKey: ['users', params],
        queryFn: () => userService.getAllUsers(params),
        placeholderData: (previousData) => previousData,
    });
};

export const useUser = (id: string | null | undefined) => {
    return useQuery({
        queryKey: ['user', id],
        queryFn: () => userService.getUser(id!),
        enabled: !!id,
    });
};

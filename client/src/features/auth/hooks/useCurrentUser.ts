import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAppSelector } from '@/store/hooks';

export const useCurrentUser = () => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    return useQuery({
        queryKey: ['currentUser'],
        queryFn: () => authService.getMe(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        enabled: isAuthenticated, // Only fetch when user is authenticated
    });
};

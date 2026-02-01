import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '../services/auth.service';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '../store/authSlice';
import { ROUTES } from '@/lib/constants/routes';
import type { ILoginRequest } from '../types/auth.types';
import { useTranslation } from 'react-i18next';
import { resetRefreshAttempts, startTokenRefreshMonitoring } from '@/lib/utils/token-refresh';

export const useLogin = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: ILoginRequest) => authService.login(data),
        onSuccess: (response) => {
            console.log('🔐 Login successful, response:', {
                hasUser: !!response.user,
                hasTokens: !!response.tokens,
            });

            // Store user and tokens in Redux
            dispatch(setCredentials({
                user: response.user,
                tokens: response.tokens,
            }));

            // Reset refresh attempt counter and start token refresh monitoring
            resetRefreshAttempts();
            startTokenRefreshMonitoring();

            // Show success message
            toast.success(t('auth.login_success') || 'Logged in successfully');

            // Navigate to home page or dashboard
            router.push(ROUTES.HOME);
        },
        onError: (error: any) => {
            // Handled in component but we can log here
            console.error("Login failed", error);
        }
    });
};

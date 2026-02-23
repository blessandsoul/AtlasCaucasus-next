import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAppDispatch } from '@/store/hooks';
import { logout as logoutAction } from '../store/authSlice';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/lib/utils/error';
import { stopTokenRefreshMonitoring } from '@/lib/utils/token-refresh';
import { clearCsrfToken } from '@/lib/api/csrf';

export const useLogoutAll = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const router = useRouter();

    return useMutation({
        mutationFn: () => authService.logoutAll(),
        onSuccess: () => {
            // Stop token refresh monitoring
            stopTokenRefreshMonitoring();
            // Clear CSRF token
            clearCsrfToken();
            // Clear Redux state
            dispatch(logoutAction());
            // Clear localStorage
            localStorage.removeItem('auth');
            // Show success message
            toast.success(t('auth.logout_all_success', 'Successfully logged out from all devices'));
            // Navigate to home
            router.push(ROUTES.HOME);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

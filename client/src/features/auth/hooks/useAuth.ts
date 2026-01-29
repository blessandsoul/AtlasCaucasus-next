import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth.service';
import { logout as logoutAction, updateUser } from '../store/authSlice';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useAuth = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { user, isAuthenticated, tokens } = useAppSelector((state) => state.auth);

    const refreshUser = useCallback(async () => {
        try {
            const userData = await authService.getMe();
            dispatch(updateUser(userData));
            return userData;
        } catch (error) {
            console.error('Failed to refresh user data:', error);
            return null;
        }
    }, [dispatch]);

    const logout = async () => {
        try {
            // Send logout request to server with refresh token
            if (tokens?.refreshToken) {
                await authService.logout(tokens.refreshToken);
            }
            toast.success(t('auth.logout_success') || 'Logged out successfully');
        } catch (error) {
            // Still logout locally even if server request fails
            console.error('Logout error:', error);
        } finally {
            // Clear Redux state
            dispatch(logoutAction());
            // Clear localStorage
            localStorage.removeItem('auth');
            // Navigate to home
            router.push('/');
        }
    };

    return {
        user,
        isAuthenticated,
        tokens,
        logout,
        refreshUser,
    };
};

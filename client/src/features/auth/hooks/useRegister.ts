import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '../services/auth.service';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '../store/authSlice';
import { ROUTES } from '@/lib/constants/routes';
import { getErrorMessage } from '@/lib/utils/error';
import type { IRegisterRequest } from '../types/auth.types';
import { useTranslation } from 'react-i18next';

export const useRegister = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: IRegisterRequest) => authService.register(data),
        onSuccess: (response) => {
            // Store user and tokens in Redux
            dispatch(setCredentials({
                user: response.user,
                tokens: response.tokens,
            }));

            // TODO: Start automatic token refresh monitoring if implemented in Next.js client

            // Show success message with verification expiry notice
            toast.success(
                t('auth.registration_success') || 'Registration successful! Please verify your email within 7 days.',
                { duration: 5000 }
            );

            // Navigate to email verification pending page
            router.push(ROUTES.VERIFY_EMAIL_PENDING);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

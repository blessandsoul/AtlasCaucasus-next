import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authService } from '../services/auth.service';
import { getErrorMessage } from '@/lib/utils/error';

interface ForgotPasswordRequest {
    email: string;
}

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (data: ForgotPasswordRequest) => authService.requestPasswordReset(data.email),
        onSuccess: () => {
            // No navigation, just success message as per requirement
            // "after providing we should display text that they should follow instructions on email"
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

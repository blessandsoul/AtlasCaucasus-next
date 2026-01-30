'use client';

import { useState } from 'react';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService } from '@/features/auth/services/auth.service';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils/error';
import { logout } from '@/features/auth/store/authSlice';

export default function VerifyEmailPendingPage() {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const handleResendVerification = async () => {
        if (!user?.email) return;

        setIsResending(true);
        setResendSuccess(false);

        try {
            await authService.resendVerification(user.email);
            setResendSuccess(true);
            toast.success(t('auth.verification_email_sent') || 'Verification email sent!');
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsResending(false);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-lg border shadow-sm p-8">
                    {/* Logo/Brand */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-foreground">
                            {t('header.brand.name') || 'Atlas Caucasus'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('header.brand.slogan') || 'Discover the Caucasus'}
                        </p>
                    </div>

                    {/* Email Icon */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            {t('auth.verify_email_pending_title') || 'Check your email'}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            {t('auth.verify_email_pending_subtitle') || 'We sent you a verification link'}
                        </p>
                    </div>

                    {/* User Email Display */}
                    {user?.email && (
                        <div className="bg-muted/50 rounded-md p-3 mb-6 text-center">
                            <p className="text-sm text-muted-foreground mb-1">
                                {t('auth.verification_sent_to') || 'Verification email sent to'}
                            </p>
                            <p className="font-medium text-foreground">{user.email}</p>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-semibold text-primary">1</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('auth.verify_step_1') || 'Open your email inbox'}
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-semibold text-primary">2</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('auth.verify_step_2') || 'Click the verification link in the email'}
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-semibold text-primary">3</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('auth.verify_step_3') || 'Start exploring Atlas Caucasus'}
                            </p>
                        </div>
                    </div>

                    {/* Resend Button */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleResendVerification}
                            disabled={isResending || resendSuccess}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {resendSuccess && <CheckCircle2 className="mr-2 h-4 w-4" />}
                            {resendSuccess
                                ? (t('auth.verification_email_sent') || 'Verification email sent!')
                                : (t('auth.resend_verification_email') || 'Resend verification email')}
                        </Button>

                        {resendSuccess && (
                            <p className="text-xs text-center text-muted-foreground">
                                {t('auth.check_spam_folder') || "Don't forget to check your spam folder"}
                            </p>
                        )}

                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="w-full"
                        >
                            {t('auth.logout') || 'Log out'}
                        </Button>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 pt-6 border-t">
                        <p className="text-xs text-center text-muted-foreground">
                            {t('auth.verification_link_expires') || 'The verification link expires in 24 hours'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

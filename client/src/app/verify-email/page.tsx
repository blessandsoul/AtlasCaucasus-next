'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle, Mail, Clock } from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getErrorCode, getErrorMessage } from '@/lib/utils/error';
import { ERROR_CODES } from '@/lib/constants/error-codes';

type VerificationStatus = 'verifying' | 'success' | 'error' | 'expired' | 'invalid';

function VerifyEmailContent() {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<VerificationStatus>('verifying');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [resendEmail, setResendEmail] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const hasVerified = useRef(false);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('invalid');
            return;
        }

        // Prevent double API calls in React strict mode
        if (hasVerified.current) {
            return;
        }
        hasVerified.current = true;

        const verifyEmail = async () => {
            try {
                await authService.verifyEmail(token);
                setStatus('success');

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push(ROUTES.LOGIN);
                }, 3000);
            } catch (error: unknown) {
                const errorCode = getErrorCode(error);

                if (errorCode === ERROR_CODES.VERIFICATION_TOKEN_EXPIRED) {
                    setStatus('expired');
                    setErrorMessage(
                        t('auth.verification_link_expired') ||
                        'Your verification link has expired.'
                    );
                } else {
                    setStatus('error');
                    setErrorMessage(getErrorMessage(error));
                }
            }
        };

        verifyEmail();
    }, [searchParams, router, t]);

    const handleResendVerification = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resendEmail.trim()) {
            toast.error(t('auth.email_required') || 'Please enter your email address');
            return;
        }

        setIsResending(true);
        setResendSuccess(false);

        try {
            await authService.resendVerification(resendEmail.trim());
            setResendSuccess(true);
            toast.success(t('auth.verification_email_sent') || 'Verification email sent!');
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsResending(false);
        }
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

                    {/* Verifying State */}
                    {status === 'verifying' && (
                        <div className="text-center py-8">
                            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                {t('auth.verifying_email') || 'Verifying your email'}
                            </h2>
                            <p className="text-muted-foreground">
                                {t('auth.verifying_email_subtitle') || 'Please wait while we verify your email address...'}
                            </p>
                        </div>
                    )}

                    {/* Success State */}
                    {status === 'success' && (
                        <div className="text-center py-8">
                            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                {t('auth.email_verified_success') || 'Email verified!'}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {t('auth.email_verified_subtitle') || 'Your email has been verified. Redirecting to login...'}
                            </p>
                            <Button
                                onClick={() => router.push(ROUTES.LOGIN)}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {t('auth.continue_to_login') || 'Continue to login'}
                            </Button>
                        </div>
                    )}

                    {/* Expired Token State */}
                    {status === 'expired' && (
                        <div className="text-center py-8">
                            <Clock className="h-16 w-16 text-warning mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                {t('auth.verification_link_expired_title') || 'Verification link expired'}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {errorMessage}
                            </p>

                            {resendSuccess ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-2 text-success">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span className="font-medium">
                                            {t('auth.verification_email_sent') || 'Verification email sent!'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {t('auth.check_inbox_and_spam') || 'Please check your inbox and spam folder.'}
                                    </p>
                                    <Button
                                        onClick={() => router.push(ROUTES.LOGIN)}
                                        variant="outline"
                                        className="w-full mt-4"
                                    >
                                        {t('auth.go_to_login') || 'Go to login'}
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleResendVerification} className="space-y-4 text-left">
                                    <div>
                                        <Label htmlFor="resend-email" className="text-sm font-medium">
                                            {t('auth.enter_email_to_resend') || 'Enter your email to resend verification'}
                                        </Label>
                                        <Input
                                            id="resend-email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={resendEmail}
                                            onChange={(e) => setResendEmail(e.target.value)}
                                            className="mt-1.5"
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isResending}
                                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t('auth.resend_verification_email') || 'Resend verification email'}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => router.push(ROUTES.LOGIN)}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        {t('auth.go_to_login') || 'Go to login'}
                                    </Button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Error State */}
                    {status === 'error' && (
                        <div className="text-center py-8">
                            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                {t('auth.verification_failed') || 'Verification failed'}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {errorMessage}
                            </p>
                            <div className="space-y-3">
                                <Button
                                    onClick={() => router.push(ROUTES.HOME)}
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    {t('auth.go_to_home') || 'Go to home'}
                                </Button>
                                <Link href={ROUTES.REGISTER}>
                                    <Button variant="outline" className="w-full">
                                        {t('auth.register_again') || 'Register again'}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Invalid Token State */}
                    {status === 'invalid' && (
                        <div className="text-center py-8">
                            <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                {t('auth.invalid_verification_link') || 'Invalid verification link'}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {t('auth.invalid_verification_link_subtitle') || 'The verification link is missing or invalid.'}
                            </p>
                            <Button
                                onClick={() => router.push(ROUTES.HOME)}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {t('auth.go_to_home') || 'Go to home'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}

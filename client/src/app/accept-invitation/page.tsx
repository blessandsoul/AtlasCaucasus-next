'use client';

import { useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2, XCircle, UserPlus } from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { PasswordStrengthIndicator } from '@/features/auth/components/PasswordStrengthIndicator';
import { createResetPasswordSchema, type ResetPasswordFormData } from '@/features/auth/schemas/validation';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils/error';

type InvitationStatus = 'idle' | 'submitting' | 'success' | 'error' | 'invalid';

function AcceptInvitationContent() {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<InvitationStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const hasSubmitted = useRef(false);

    const token = searchParams.get('token');

    const form = useForm<ResetPasswordFormData>({
        resolver: zodResolver(createResetPasswordSchema(t)),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    });

    const password = form.watch('newPassword');

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            setStatus('invalid');
            return;
        }

        if (hasSubmitted.current) return;
        hasSubmitted.current = true;

        setStatus('submitting');

        try {
            await authService.acceptInvitation(token, data.newPassword);
            setStatus('success');
            toast.success(
                t('auth.invitation_accepted_success') ||
                'Invitation accepted! You can now log in.'
            );

            setTimeout(() => {
                router.push(ROUTES.LOGIN);
            }, 3000);
        } catch (error: unknown) {
            setStatus('error');
            setErrorMessage(getErrorMessage(error));
            hasSubmitted.current = false;
        }
    };

    // No token in URL
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md">
                    <div className="bg-card rounded-lg border shadow-sm p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-foreground">
                                {t('header.brand.name') || 'Atlas Caucasus'}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t('header.brand.slogan') || 'Discover the Caucasus'}
                            </p>
                        </div>
                        <div className="text-center py-8">
                            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                {t('auth.invalid_invitation_link') || 'Invalid invitation link'}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {t('auth.invalid_invitation_link_subtitle') || 'The invitation link is missing or invalid.'}
                            </p>
                            <Button
                                onClick={() => router.push(ROUTES.HOME)}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {t('auth.go_to_home') || 'Go to home'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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

                    {/* Success State */}
                    {status === 'success' && (
                        <div className="text-center py-8">
                            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                {t('auth.invitation_accepted_title') || 'Invitation accepted!'}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {t('auth.invitation_accepted_subtitle') || 'Your account is ready. Redirecting to login...'}
                            </p>
                            <Button
                                onClick={() => router.push(ROUTES.LOGIN)}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {t('auth.continue_to_login') || 'Continue to login'}
                            </Button>
                        </div>
                    )}

                    {/* Error State */}
                    {status === 'error' && (
                        <div className="text-center py-8">
                            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                {t('auth.invitation_failed') || 'Could not accept invitation'}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {errorMessage}
                            </p>
                            <div className="space-y-3">
                                <Button
                                    onClick={() => {
                                        setStatus('idle');
                                        setErrorMessage('');
                                    }}
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    {t('auth.try_again') || 'Try again'}
                                </Button>
                                <Button
                                    onClick={() => router.push(ROUTES.HOME)}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {t('auth.go_to_home') || 'Go to home'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Password Form (idle/submitting) */}
                    {(status === 'idle' || status === 'submitting') && (
                        <>
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                                    <UserPlus className="h-8 w-8 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground mb-2">
                                    {t('auth.accept_invitation_title') || 'Accept your invitation'}
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    {t('auth.accept_invitation_subtitle') || 'Set a password to activate your tour agent account'}
                                </p>
                            </div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t('auth.new_password') || 'New password'}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder={t('auth.password_placeholder') || 'Enter your password'}
                                                        autoComplete="new-password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                {password && <PasswordStrengthIndicator password={password} />}
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {t('auth.confirm_password') || 'Confirm password'}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder={t('auth.password_placeholder') || 'Enter your password'}
                                                        autoComplete="new-password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                        disabled={status === 'submitting'}
                                    >
                                        {status === 'submitting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {status === 'submitting'
                                            ? (t('auth.accepting_invitation') || 'Accepting invitation...')
                                            : (t('auth.accept_invitation') || 'Accept invitation')}
                                    </Button>

                                    <div className="text-center">
                                        <Button
                                            type="button"
                                            variant="link"
                                            onClick={() => router.push(ROUTES.LOGIN)}
                                            className="text-sm"
                                        >
                                            {t('auth.back_to_login') || 'Back to login'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AcceptInvitationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <AcceptInvitationContent />
        </Suspense>
    );
}

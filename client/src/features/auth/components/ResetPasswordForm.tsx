'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { authService } from '../services/auth.service';
import { createResetPasswordSchema, type ResetPasswordFormData } from '../schemas/validation';
import { getErrorMessage } from '@/lib/utils/error';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { ROUTES } from '@/lib/constants/routes';

export const ResetPasswordForm = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            toast.error(t('auth.invalid_reset_link') || 'Invalid reset link');
            return;
        }

        setIsSubmitting(true);
        try {
            await authService.resetPassword(token, data.newPassword);
            toast.success(t('auth.password_reset_success') || 'Password reset successfully!');
            router.push(ROUTES.LOGIN);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <p className="text-destructive">
                    {t('auth.invalid_reset_link') || 'Invalid or missing reset link'}
                </p>
                <Button
                    onClick={() => router.push(ROUTES.FORGOT_PASSWORD)}
                    variant="outline"
                >
                    {t('auth.request_new_link') || 'Request a new link'}
                </Button>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('auth.new_password') || 'New password'}</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={t('auth.password_placeholder')}
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
                            <FormLabel>{t('auth.confirm_password') || 'Confirm password'}</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={t('auth.password_placeholder')}
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
                    disabled={isSubmitting}
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting
                        ? (t('auth.resetting_password') || 'Resetting password...')
                        : (t('auth.reset_password') || 'Reset password')}
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
    );
};

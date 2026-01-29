'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ROUTES } from '@/lib/constants/routes';
import { createLoginSchema, type LoginFormData } from '../schemas/validation';
import { useLogin } from '../hooks/useLogin';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const LoginForm = () => {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const loginMutation = useLogin();

    const form = useForm<LoginFormData>({
        resolver: zodResolver(createLoginSchema(t)),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        // Clear previous error
        setLoginError(null);

        loginMutation.mutate(data, {
            onSuccess: () => {
                setLoginError(null);
            },
            onError: (error: any) => {
                // Set error message to display in form
                const errorMessage = error?.response?.data?.error?.message || 'Invalid credentials';
                setLoginError(errorMessage);

                // Clear password field on failed login
                form.setValue('password', '');
                form.setFocus('password');
            }
        });
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                autoComplete="on"
            >
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('auth.email')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder={t('auth.email_placeholder') || 'email@example.com'}
                                    autoComplete="username"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>{t('auth.password')}</FormLabel>
                                <Link
                                    href={ROUTES.FORGOT_PASSWORD}
                                    className="text-sm font-medium text-primary hover:text-primary/90"
                                >
                                    {t('auth.forgot_password') || 'Forgot password?'}
                                </Link>
                            </div>
                            <div className="relative">
                                <FormControl>
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={t('auth.password_placeholder') || '******'}
                                        autoComplete="current-password"
                                        className="pr-10"
                                        {...field}
                                    />
                                </FormControl>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-4 w-4" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Login Error Message */}
                {loginError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                )}

                <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={loginMutation.isPending}
                >
                    {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.sign_in') || 'Sign In'}
                </Button>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">{t('auth.no_account') || "Don't have an account?"} </span>
                    <Link
                        href={ROUTES.REGISTER}
                        className="font-medium text-primary hover:text-primary/90"
                    >
                        {t('auth.create_account') || 'Sign up'}
                    </Link>
                </div>
            </form>
        </Form>
    );
};

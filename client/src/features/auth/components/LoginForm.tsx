'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, AlertCircle, Lock, Clock } from 'lucide-react';

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getErrorCode, getErrorDetails } from '@/lib/utils/error';
import { ERROR_CODES } from '@/lib/constants/error-codes';

// LocalStorage key for persisting rate limit state across page refreshes
const RATE_LIMIT_KEY = 'login_rate_limit_until';

export const LoginForm = () => {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
    const [countdown, setCountdown] = useState<number>(0);
    const loginMutation = useLogin();

    // On mount, check for existing rate limit in localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const storedLimit = localStorage.getItem(RATE_LIMIT_KEY);
        if (storedLimit) {
            const limitTime = parseInt(storedLimit, 10);
            if (limitTime > Date.now()) {
                setLockoutUntil(new Date(limitTime));
                setLoginError(t('auth.rate_limited') || 'Too many login attempts. Please wait before trying again.');
            } else {
                // Expired, clean up
                localStorage.removeItem(RATE_LIMIT_KEY);
            }
        }
    }, [t]);

    const form = useForm<LoginFormData>({
        resolver: zodResolver(createLoginSchema(t)),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // Countdown timer for lockout
    useEffect(() => {
        if (!lockoutUntil) {
            setCountdown(0);
            return;
        }

        const updateCountdown = () => {
            const now = new Date();
            const remaining = Math.max(0, Math.ceil((lockoutUntil.getTime() - now.getTime()) / 1000));
            setCountdown(remaining);

            if (remaining <= 0) {
                setLockoutUntil(null);
                setLoginError(null);
                setRemainingAttempts(null);
                // Clear localStorage when lockout expires
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(RATE_LIMIT_KEY);
                }
            }
        };

        // Initial update
        updateCountdown();

        // Update every second
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [lockoutUntil]);

    // Format countdown as mm:ss
    const formatCountdown = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const handleLoginError = useCallback((error: unknown) => {
        const errorCode = getErrorCode(error);
        const errorDetails = getErrorDetails(error);

        if (errorCode === ERROR_CODES.ACCOUNT_LOCKED) {
            // Account is locked - show countdown and persist to localStorage
            const lockoutEndsAt = errorDetails?.lockoutEndsAt as string | undefined;
            if (lockoutEndsAt) {
                const lockoutDate = new Date(lockoutEndsAt);
                setLockoutUntil(lockoutDate);
                // Save to localStorage so it survives page refresh
                if (typeof window !== 'undefined') {
                    localStorage.setItem(RATE_LIMIT_KEY, lockoutDate.getTime().toString());
                }
            }
            setLoginError(t('auth.account_locked') || 'Account temporarily locked due to too many failed attempts.');
            setRemainingAttempts(null);
        } else if (errorCode === ERROR_CODES.INVALID_CREDENTIALS) {
            // Invalid credentials - show remaining attempts if provided
            const attempts = errorDetails?.remainingAttempts as number | undefined;
            if (attempts !== undefined && attempts !== null) {
                setRemainingAttempts(attempts);
                if (attempts <= 2) {
                    setLoginError(
                        t('auth.invalid_credentials_with_attempts', { count: attempts }) ||
                        `Invalid email or password. ${attempts} attempt${attempts !== 1 ? 's' : ''} remaining before lockout.`
                    );
                } else {
                    setLoginError(t('auth.invalid_credentials') || 'Invalid email or password.');
                }
            } else {
                setLoginError(t('auth.invalid_credentials') || 'Invalid email or password.');
                setRemainingAttempts(null);
            }
        } else if (errorCode === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
            // Rate limited - persist to localStorage so it survives page refresh
            const retryAfter = errorDetails?.retryAfter as number | undefined;
            if (retryAfter) {
                const untilMs = Date.now() + retryAfter * 1000;
                const until = new Date(untilMs);
                setLockoutUntil(until);
                // Save to localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem(RATE_LIMIT_KEY, untilMs.toString());
                }
            }
            setLoginError(t('auth.rate_limited') || 'Too many login attempts. Please wait before trying again.');
        } else {
            // Generic error
            const errorMessage = (error as any)?.response?.data?.error?.message || 'An error occurred. Please try again.';
            setLoginError(errorMessage);
            setRemainingAttempts(null);
        }
    }, [t]);

    const onSubmit = async (data: LoginFormData) => {
        // Don't allow submission if locked out
        if (lockoutUntil && new Date() < lockoutUntil) {
            return;
        }

        // Clear previous error
        setLoginError(null);
        setRemainingAttempts(null);

        loginMutation.mutate(data, {
            onSuccess: () => {
                setLoginError(null);
                setLockoutUntil(null);
                setRemainingAttempts(null);
                // Clear any stored rate limit on successful login
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(RATE_LIMIT_KEY);
                }
            },
            onError: (error: unknown) => {
                handleLoginError(error);

                // Clear password field on failed login
                form.setValue('password', '');
                form.setFocus('password');
            }
        });
    };

    const isLockedOut = lockoutUntil !== null && countdown > 0;

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

                {/* Lockout Warning */}
                {isLockedOut && (
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                        <Lock className="h-4 w-4" />
                        <AlertTitle className="font-semibold">
                            {t('auth.account_locked_title') || 'Account Temporarily Locked'}
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                            <p>{loginError}</p>
                            <div className="mt-3 flex items-center gap-2 text-sm font-medium">
                                <Clock className="h-4 w-4" />
                                <span>
                                    {t('auth.try_again_in') || 'Try again in'}: {formatCountdown(countdown)}
                                </span>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Login Error Message (non-lockout) */}
                {loginError && !isLockedOut && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {loginError}
                            {remainingAttempts !== null && remainingAttempts <= 2 && (
                                <span className="mt-1 block text-xs opacity-80">
                                    {t('auth.lockout_warning') || 'Your account will be locked after too many failed attempts.'}
                                </span>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={loginMutation.isPending || isLockedOut}
                >
                    {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLockedOut
                        ? (t('auth.locked_out') || 'Locked Out')
                        : (t('auth.sign_in') || 'Sign In')
                    }
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

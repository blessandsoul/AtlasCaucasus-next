'use client';

import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

function ResetPasswordContent() {
    const { t } = useTranslation();

    return (
        <AuthLayout
            title={t('auth.reset_password') || 'Reset password'}
            subtitle={t('auth.reset_password_subtitle') || 'Enter your new password below.'}
        >
            <ResetPasswordForm />
        </AuthLayout>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}

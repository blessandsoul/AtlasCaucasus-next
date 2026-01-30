'use client';

import { useTranslation } from 'react-i18next';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

export default function ForgotPasswordPage() {
    const { t } = useTranslation();

    return (
        <AuthLayout
            title={t('auth.forgot_password') || 'Forgot password'}
            subtitle={t('auth.forgot_password_subtitle') || "No worries, we'll send you reset instructions."}
        >
            <ForgotPasswordForm />
        </AuthLayout>
    );
}

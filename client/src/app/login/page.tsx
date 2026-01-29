'use client';

import { useTranslation } from 'react-i18next';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

export default function LoginPage() {
    const { t } = useTranslation();

    return (
        <AuthLayout
            title={t('auth.welcome_back') || 'Welcome back'}
            subtitle={t('auth.sign_in_subtitle') || 'Please enter your details.'}
        >
            <LoginForm />
        </AuthLayout>
    );
}

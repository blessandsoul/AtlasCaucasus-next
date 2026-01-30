'use client';

import { useTranslation } from 'react-i18next';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

export default function RegisterPage() {
    const { t } = useTranslation();

    return (
        <AuthLayout
            title={t('auth.create_account') || 'Create account'}
            subtitle={t('auth.sign_up_subtitle') || 'Start your journey with us.'}
        >
            <RegisterForm />
        </AuthLayout>
    );
}

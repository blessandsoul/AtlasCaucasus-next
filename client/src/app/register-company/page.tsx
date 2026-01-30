'use client';

import { useTranslation } from 'react-i18next';
import { CompanyRegisterForm } from '@/features/auth/components/CompanyRegisterForm';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

export default function CompanyRegisterPage() {
    const { t } = useTranslation();

    return (
        <AuthLayout
            title={t('auth.register_company') || 'Register your company'}
            subtitle={t('auth.register_company_subtitle') || 'Grow your business with us.'}
        >
            <CompanyRegisterForm />
        </AuthLayout>
    );
}

'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
    isActive: boolean;
    className?: string;
    showLabel?: boolean;
}

export const StatusIndicator = ({ isActive, className, showLabel = false }: StatusIndicatorProps) => {
    const { t } = useTranslation();

    return (
        <div className={cn("flex items-center gap-2", className)} title={isActive ? t('common.active') : t('common.inactive')}>
            {isActive ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
                <XCircle className="h-5 w-5 text-red-500" />
            )}
            {showLabel && (
                <span className={cn(
                    "text-sm font-medium",
                    isActive ? "text-green-600" : "text-red-600"
                )}>
                    {isActive ? t('common.active') : t('common.inactive')}
                </span>
            )}
        </div>
    );
};

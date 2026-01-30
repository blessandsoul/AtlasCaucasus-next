'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils/error';

interface ErrorMessageProps {
    error: unknown;
    title?: string;
    className?: string;
}

export function ErrorMessage({ error, title = 'Error', className }: ErrorMessageProps) {
    const message = getErrorMessage(error);

    return (
        <Alert variant="destructive" className={className}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    );
}

'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function BookingsError({ error, reset }: ErrorProps): React.ReactNode {
    useEffect(() => {
        console.error('Bookings error:', error);
    }, [error]);

    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
            <p className="mb-6 text-base text-muted-foreground max-w-md">
                We had trouble loading your bookings. Please try again.
            </p>
            <Button onClick={reset} className="h-12 px-6 text-base">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
            </Button>
        </div>
    );
}

'use client';

import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
    isOnline: boolean;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
};

export const OnlineIndicator = ({
    isOnline,
    size = 'md',
    showLabel = false,
    className,
}: OnlineIndicatorProps) => {
    return (
        <div className={cn('flex items-center gap-1.5', className)}>
            <span
                className={cn(
                    'rounded-full',
                    sizeClasses[size],
                    isOnline ? 'bg-green-500' : 'bg-gray-300'
                )}
                title={isOnline ? 'Online' : 'Offline'}
            />
            {showLabel && (
                <span
                    className={cn(
                        'text-xs',
                        isOnline ? 'text-green-600' : 'text-muted-foreground'
                    )}
                >
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            )}
        </div>
    );
};

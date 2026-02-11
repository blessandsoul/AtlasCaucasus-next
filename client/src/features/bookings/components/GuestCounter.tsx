'use client';

import { useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface GuestCounterProps {
    value: number;
    min?: number;
    max: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}

export function GuestCounter({
    value,
    min = 1,
    max,
    onChange,
    disabled = false,
}: GuestCounterProps): React.ReactNode {
    const handleDecrease = useCallback((): void => {
        if (value > min) onChange(value - 1);
    }, [value, min, onChange]);

    const handleIncrease = useCallback((): void => {
        if (value < max) onChange(value + 1);
    }, [value, max, onChange]);

    return (
        <div className="flex items-center justify-center gap-6" role="group" aria-label="Guest count selector">
            <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full shrink-0"
                onClick={handleDecrease}
                disabled={disabled || value <= min}
                aria-label="Decrease guests"
            >
                <Minus className="h-5 w-5" />
            </Button>
            <span
                className="text-3xl font-bold tabular-nums min-w-[3ch] text-center"
                aria-live="polite"
                aria-label={`${value} guests`}
            >
                {value}
            </span>
            <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full shrink-0"
                onClick={handleIncrease}
                disabled={disabled || value >= max}
                aria-label="Increase guests"
            >
                <Plus className="h-5 w-5" />
            </Button>
        </div>
    );
}

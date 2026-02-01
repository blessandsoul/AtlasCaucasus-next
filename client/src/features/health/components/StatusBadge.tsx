'use client';

import { cn } from '@/lib/utils';
import type { HealthStatus } from '../types/health.types';

interface StatusBadgeProps {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig: Record<
  HealthStatus,
  { label: string; bgColor: string; textColor: string; dotColor: string }
> = {
  healthy: {
    label: 'Operational',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-800 dark:text-green-300',
    dotColor: 'bg-green-500',
  },
  degraded: {
    label: 'Degraded',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-800 dark:text-yellow-300',
    dotColor: 'bg-yellow-500',
  },
  unhealthy: {
    label: 'Outage',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-300',
    dotColor: 'bg-red-500',
  },
};

const sizeConfig = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    dot: 'h-1.5 w-1.5',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm',
    dot: 'h-2 w-2',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base',
    dot: 'h-2.5 w-2.5',
  },
};

export const StatusBadge = ({
  status,
  size = 'md',
  showLabel = true,
}: StatusBadgeProps) => {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bgColor,
        config.textColor,
        sizes.badge
      )}
    >
      <span
        className={cn('rounded-full animate-pulse', config.dotColor, sizes.dot)}
      />
      {showLabel && config.label}
    </span>
  );
};

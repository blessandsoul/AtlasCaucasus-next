'use client';

import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import type { HealthStatus } from '../types/health.types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverallStatusProps {
  status: HealthStatus;
  lastUpdated: string;
  version?: string;
}

const statusConfig: Record<
  HealthStatus,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    bgGradient: string;
  }
> = {
  healthy: {
    title: 'All Systems Operational',
    description: 'All services are running normally.',
    icon: CheckCircle2,
    bgGradient: 'from-green-500/10 to-green-500/5',
  },
  degraded: {
    title: 'Partial System Outage',
    description: 'Some services are experiencing issues.',
    icon: AlertTriangle,
    bgGradient: 'from-yellow-500/10 to-yellow-500/5',
  },
  unhealthy: {
    title: 'Major System Outage',
    description: 'Critical services are unavailable.',
    icon: XCircle,
    bgGradient: 'from-red-500/10 to-red-500/5',
  },
};

export const OverallStatus = ({
  status,
  lastUpdated,
  version,
}: OverallStatusProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  const formattedTime = new Date(lastUpdated).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Card
      className={cn(
        'overflow-hidden border-0 bg-gradient-to-br',
        config.bgGradient
      )}
    >
      <CardContent className="p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm">
            <Icon
              className={cn(
                'h-8 w-8',
                status === 'healthy' && 'text-green-500',
                status === 'degraded' && 'text-yellow-500',
                status === 'unhealthy' && 'text-red-500'
              )}
            />
          </div>
          <div className="flex-1">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{config.title}</h2>
                <p className="text-muted-foreground">{config.description}</p>
              </div>
              <StatusBadge status={status} size="lg" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t pt-4 text-sm text-muted-foreground sm:justify-start">
          <span>Last updated: {formattedTime}</span>
          {version && (
            <>
              <span className="hidden sm:inline">•</span>
              <span>Version: {version}</span>
            </>
          )}
          <span className="hidden sm:inline">•</span>
          <span>Auto-refreshes every 30 seconds</span>
        </div>
      </CardContent>
    </Card>
  );
};

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { HealthMetricsResponse } from '../types/health.types';
import { Clock, Cpu, HardDrive, Activity } from 'lucide-react';

interface SystemMetricsProps {
  metrics: HealthMetricsResponse;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(' ') : '< 1m';
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export const SystemMetrics = ({ metrics }: SystemMetricsProps) => {
  if (!metrics) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          System Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Uptime */}
        {metrics.uptime !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Uptime</span>
            </div>
            <span className="font-medium">{formatUptime(metrics.uptime)}</span>
          </div>
        )}

        {/* Memory Usage */}
        {metrics.memory && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span>Memory Usage</span>
              </div>
              <span className="font-medium">
                {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
              </span>
            </div>
            <Progress value={metrics.memory.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {metrics.memory.percentage.toFixed(1)}% used
            </p>
          </div>
        )}

        {/* CPU Usage */}
        {metrics.cpu && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span>CPU Usage</span>
              </div>
              <span className="font-medium">{metrics.cpu.usage.toFixed(1)}%</span>
            </div>
            <Progress value={metrics.cpu.usage} className="h-2" />
          </div>
        )}

        {/* Request Stats */}
        {metrics.requests && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Requests</span>
            <div className="text-right">
              <p className="font-medium">{metrics.requests.total.toLocaleString()} total</p>
              <p className="text-xs text-muted-foreground">
                {metrics.requests.perMinute.toFixed(1)}/min
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import type { ServiceHealth } from '../types/health.types';
import { Database, HardDrive, Server, Wifi } from 'lucide-react';

interface ServiceStatusCardProps {
  service: ServiceHealth;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  database: Database,
  redis: Server,
  storage: HardDrive,
  api: Wifi,
};

export const ServiceStatusCard = ({ service }: ServiceStatusCardProps) => {
  const Icon = iconMap[service.name.toLowerCase()] || Server;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium capitalize">{service.name}</h3>
              {service.responseTime !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {service.responseTime}ms response time
                </p>
              )}
              {service.message && (
                <p className="text-xs text-muted-foreground">{service.message}</p>
              )}
            </div>
          </div>
          <StatusBadge status={service.status} size="sm" />
        </div>
      </CardContent>
    </Card>
  );
};

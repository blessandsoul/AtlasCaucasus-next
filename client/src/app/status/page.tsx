'use client';

import { useDetailedHealth, useHealthMetrics } from '@/features/health/hooks/useHealth';
import { OverallStatus } from '@/features/health/components/OverallStatus';
import { ServiceStatusCard } from '@/features/health/components/ServiceStatusCard';
import { SystemMetrics } from '@/features/health/components/SystemMetrics';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HealthStatus, ServiceHealth } from '@/features/health/types/health.types';

export default function StatusPage() {
  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
    isFetching: healthFetching,
  } = useDetailedHealth();

  const {
    data: metricsData,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
    isFetching: metricsFetching,
  } = useHealthMetrics();

  const handleRefresh = () => {
    refetchHealth();
    refetchMetrics();
  };

  const isLoading = healthLoading || metricsLoading;
  const isFetching = healthFetching || metricsFetching;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading system status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (healthError) {
    // If we can't reach the health endpoint, the system is likely down
    const errorStatus: HealthStatus = 'unhealthy';

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">System Status</h1>
              <p className="text-muted-foreground">
                Real-time status of Atlas Caucasus services
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>

          <OverallStatus
            status={errorStatus}
            lastUpdated={new Date().toISOString()}
          />

          <Card className="mt-6">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h3 className="font-semibold">Unable to Connect</h3>
                <p className="text-sm text-muted-foreground">
                  We&apos;re experiencing connectivity issues with our services.
                  Please try again later.
                </p>
              </div>
              <Button onClick={handleRefresh} disabled={isFetching}>
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
                />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Convert services object to array for rendering
  const services: ServiceHealth[] = healthData?.services
    ? Object.entries(healthData.services)
        .filter(([, service]) => service !== undefined)
        .map(([name, service]) => ({
          ...service!,
          name: name.charAt(0).toUpperCase() + name.slice(1),
        }))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Status</h1>
            <p className="text-muted-foreground">
              Real-time status of Atlas Caucasus services
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {/* Overall Status */}
        <OverallStatus
          status={healthData?.status || 'healthy'}
          lastUpdated={healthData?.timestamp || new Date().toISOString()}
          version={healthData?.version}
        />

        {/* Services Grid */}
        {services.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">Services</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <ServiceStatusCard key={service.name} service={service} />
              ))}
            </div>
          </div>
        )}

        {/* System Metrics */}
        {metricsData && (
          <div className="mt-8">
            <SystemMetrics metrics={metricsData} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Having issues?{' '}
            <a
              href="mailto:support@atlascaucasus.com"
              className="text-primary hover:underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

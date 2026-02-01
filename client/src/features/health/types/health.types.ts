export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseTime?: number;
  message?: string;
  lastChecked?: string;
}

export interface BasicHealthResponse {
  status: HealthStatus;
  timestamp: string;
  version?: string;
}

export interface DetailedHealthResponse {
  status: HealthStatus;
  timestamp: string;
  version?: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis?: ServiceHealth;
    storage?: ServiceHealth;
  };
}

export interface HealthMetricsResponse {
  timestamp?: string;
  uptime?: number;
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu?: {
    usage: number;
  };
  requests?: {
    total: number;
    perMinute: number;
  };
}

export interface ReadinessResponse {
  ready: boolean;
  timestamp: string;
  checks?: Record<string, boolean>;
}

export interface LivenessResponse {
  alive: boolean;
  timestamp: string;
}

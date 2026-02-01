import axios from 'axios';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
  BasicHealthResponse,
  DetailedHealthResponse,
  HealthMetricsResponse,
  ReadinessResponse,
  LivenessResponse,
} from '../types/health.types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create a separate axios instance without auth interceptors
// Health endpoints are public and should not require authentication
const healthClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

class HealthService {
  /**
   * Get basic health status
   */
  async getHealth(): Promise<BasicHealthResponse> {
    const startTime = Date.now();
    const response = await healthClient.get(API_ENDPOINTS.HEALTH.BASIC);
    const endTime = Date.now();

    return {
      ...response.data,
      responseTime: endTime - startTime,
    };
  }

  /**
   * Get detailed health status with dependency checks
   */
  async getDetailedHealth(): Promise<DetailedHealthResponse> {
    const response = await healthClient.get(API_ENDPOINTS.HEALTH.DETAILED);
    return response.data;
  }

  /**
   * Get system metrics
   */
  async getMetrics(): Promise<HealthMetricsResponse> {
    const response = await healthClient.get(API_ENDPOINTS.HEALTH.METRICS);
    return response.data;
  }

  /**
   * Check if the service is ready to receive traffic
   */
  async getReadiness(): Promise<ReadinessResponse> {
    const response = await healthClient.get(API_ENDPOINTS.HEALTH.READY);
    return response.data;
  }

  /**
   * Check if the service is alive (liveness probe)
   */
  async getLiveness(): Promise<LivenessResponse> {
    const response = await healthClient.get(API_ENDPOINTS.HEALTH.LIVE);
    return response.data;
  }

  /**
   * Measure response time to the API
   */
  async measureLatency(): Promise<number> {
    const startTime = Date.now();
    await healthClient.get(API_ENDPOINTS.HEALTH.LIVE);
    return Date.now() - startTime;
  }
}

export const healthService = new HealthService();

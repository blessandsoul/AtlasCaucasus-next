'use client';

import { useQuery } from '@tanstack/react-query';
import { healthService } from '../services/health.service';

/**
 * Fetch basic health status
 * Auto-refreshes every 30 seconds
 */
export const useHealth = (options?: { enabled?: boolean; refetchInterval?: number }) => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => healthService.getHealth(),
    refetchInterval: options?.refetchInterval ?? 30000, // 30 seconds
    enabled: options?.enabled ?? true,
    retry: 1,
    staleTime: 10000, // 10 seconds
  });
};

/**
 * Fetch detailed health status with all dependencies
 * Auto-refreshes every 30 seconds
 */
export const useDetailedHealth = (options?: { enabled?: boolean; refetchInterval?: number }) => {
  return useQuery({
    queryKey: ['health', 'detailed'],
    queryFn: () => healthService.getDetailedHealth(),
    refetchInterval: options?.refetchInterval ?? 30000,
    enabled: options?.enabled ?? true,
    retry: 1,
    staleTime: 10000,
  });
};

/**
 * Fetch system metrics
 * Auto-refreshes every 30 seconds
 */
export const useHealthMetrics = (options?: { enabled?: boolean; refetchInterval?: number }) => {
  return useQuery({
    queryKey: ['health', 'metrics'],
    queryFn: () => healthService.getMetrics(),
    refetchInterval: options?.refetchInterval ?? 30000,
    enabled: options?.enabled ?? true,
    retry: 1,
    staleTime: 10000,
  });
};

/**
 * Check readiness probe
 */
export const useReadiness = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['health', 'ready'],
    queryFn: () => healthService.getReadiness(),
    refetchInterval: 30000,
    enabled: options?.enabled ?? true,
    retry: 1,
  });
};

/**
 * Check liveness probe
 */
export const useLiveness = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['health', 'live'],
    queryFn: () => healthService.getLiveness(),
    refetchInterval: 30000,
    enabled: options?.enabled ?? true,
    retry: 1,
  });
};

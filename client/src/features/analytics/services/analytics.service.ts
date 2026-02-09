import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ProviderAnalytics, AnalyticsEntityType } from '../types/analytics.types';

class AnalyticsService {
    async getMyAnalytics(): Promise<ProviderAnalytics> {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: ProviderAnalytics;
        }>(API_ENDPOINTS.ANALYTICS.ME);

        return response.data.data;
    }

    async trackView(entityType: AnalyticsEntityType, entityId: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.ANALYTICS.TRACK_VIEW, {
            entityType,
            entityId,
        });
    }
}

export const analyticsService = new AnalyticsService();

import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type {
    IUserPresence,
    IOnlineUsersResponse,
    IConnectionStats,
} from '../types/presence.types';

class PresenceService {
    async getMyPresence(): Promise<IUserPresence> {
        const response = await apiClient.get<ApiResponse<IUserPresence>>(
            API_ENDPOINTS.PRESENCE.ME
        );
        return response.data.data;
    }

    async getUserPresence(userId: string): Promise<IUserPresence> {
        const response = await apiClient.get<ApiResponse<IUserPresence>>(
            API_ENDPOINTS.PRESENCE.USER(userId)
        );
        return response.data.data;
    }

    async getMultiplePresence(userIds: string[]): Promise<IUserPresence[]> {
        const response = await apiClient.post<ApiResponse<IUserPresence[]>>(
            API_ENDPOINTS.PRESENCE.MULTIPLE,
            { userIds }
        );
        return response.data.data;
    }

    async getOnlineUsers(): Promise<IOnlineUsersResponse> {
        const response = await apiClient.get<ApiResponse<IOnlineUsersResponse>>(
            API_ENDPOINTS.PRESENCE.ONLINE_ALL
        );
        return response.data.data;
    }

    async getConnectionStats(): Promise<IConnectionStats> {
        const response = await apiClient.get<ApiResponse<IConnectionStats>>(
            API_ENDPOINTS.PRESENCE.STATS
        );
        return response.data.data;
    }
}

export const presenceService = new PresenceService();

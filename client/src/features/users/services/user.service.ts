import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { PaginatedApiResponse, PaginationParams, ApiResponse } from '@/lib/api/api.types';
import type { IUser } from '@/features/auth/types/auth.types';

export interface UpdateProfileData {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
}

class UserService {
    async getAllUsers(params: PaginationParams) {
        const response = await apiClient.get<PaginatedApiResponse<IUser>>(
            API_ENDPOINTS.USERS.LIST,
            { params }
        );
        return response.data.data;
    }

    async updateProfile(userId: string, data: UpdateProfileData): Promise<IUser> {
        const response = await apiClient.patch<ApiResponse<{ user: IUser }>>(
            API_ENDPOINTS.USERS.UPDATE(userId),
            data
        );
        return response.data.data.user;
    }

    async getUser(id: string) {
        const response = await apiClient.get<ApiResponse<{ user: IUser }>>(
            API_ENDPOINTS.USERS.BY_ID(id)
        );
        return response.data.data.user;
    }

    async updateUser(userId: string, data: Partial<IUser>) {
        const response = await apiClient.patch<{ success: boolean; data: IUser }>(
            API_ENDPOINTS.USERS.UPDATE(userId),
            data
        );
        return response.data.data;
    }

    async updateUserRole(userId: string, role: string) {
        const response = await apiClient.patch<{ success: boolean; data: IUser }>(
            API_ENDPOINTS.USERS.UPDATE_ROLE(userId),
            { role }
        );
        return response.data.data;
    }

    async removeUserRole(userId: string, role: string) {
        const response = await apiClient.delete<{ success: boolean; data: IUser }>(
            API_ENDPOINTS.USERS.REMOVE_ROLE(userId, role)
        );
        return response.data.data;
    }

    async deleteUser(userId: string) {
        await apiClient.delete(API_ENDPOINTS.USERS.DELETE(userId));
    }
}

export const userService = new UserService();

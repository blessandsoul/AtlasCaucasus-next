import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { IUser, IAuthTokens, ILoginRequest, IRegisterRequest } from '../types/auth.types';

class AuthService {
    async register(data: IRegisterRequest): Promise<{ user: IUser; tokens: IAuthTokens }> {
        const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
        const { user, accessToken, refreshToken } = response.data.data;
        return {
            user,
            tokens: { accessToken, refreshToken }
        };
    }

    async login(data: ILoginRequest): Promise<{ user: IUser; tokens: IAuthTokens }> {
        const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
        const { user, accessToken, refreshToken } = response.data.data;
        return {
            user,
            tokens: { accessToken, refreshToken }
        };
    }

    async logout(refreshToken: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    }

    async refreshToken(refreshToken: string): Promise<IAuthTokens> {
        const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
        return response.data.data;
    }

    async getMe(): Promise<IUser> {
        const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
        return response.data.data.user;
    }
}

export const authService = new AuthService();

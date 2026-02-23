import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { IUser, IAuthTokens, ILoginRequest, IRegisterRequest, ICompanyRegisterRequest, IClaimRoleRequest } from '../types/auth.types';

class AuthService {
    async register(data: IRegisterRequest): Promise<{ user: IUser; tokens: IAuthTokens }> {
        const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
        const { user, accessToken, refreshToken } = response.data.data;
        return {
            user,
            tokens: { accessToken, refreshToken }
        };
    }

    async registerCompany(data: ICompanyRegisterRequest): Promise<{ user: IUser; tokens: IAuthTokens }> {
        const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER_COMPANY, data);
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

    async getMe(): Promise<IUser> {
        const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
        return response.data.data;
    }

    async claimRole(data: IClaimRoleRequest): Promise<IUser> {
        const response = await apiClient.post(API_ENDPOINTS.AUTH.CLAIM_ROLE, data);
        return response.data.data;
    }

    async requestPasswordReset(email: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    }

    async logoutAll(): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT_ALL);
    }

    async resendVerification(email: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword });
    }

    async verifyEmail(token: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
    }

    async acceptInvitation(token: string, password: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.ACCEPT_INVITATION, { token, password });
    }
}

export const authService = new AuthService();

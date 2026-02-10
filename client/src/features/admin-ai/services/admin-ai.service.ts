import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { AdminAiTemplate, UpdateAiTemplateRequest } from '../types/admin-ai.types';

class AdminAiService {
  async getTemplates(): Promise<AdminAiTemplate[]> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: AdminAiTemplate[];
    }>(API_ENDPOINTS.ADMIN.AI_TEMPLATES);

    return response.data.data;
  }

  async getTemplate(id: string): Promise<AdminAiTemplate> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: AdminAiTemplate;
    }>(API_ENDPOINTS.ADMIN.AI_TEMPLATE(id));

    return response.data.data;
  }

  async updateTemplate(id: string, data: UpdateAiTemplateRequest): Promise<AdminAiTemplate> {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      data: AdminAiTemplate;
    }>(API_ENDPOINTS.ADMIN.AI_TEMPLATE(id), data);

    return response.data.data;
  }

  async resetTemplate(id: string): Promise<AdminAiTemplate> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: AdminAiTemplate;
    }>(API_ENDPOINTS.ADMIN.AI_TEMPLATE_RESET(id));

    return response.data.data;
  }

  async toggleTemplate(id: string, isActive: boolean): Promise<AdminAiTemplate> {
    const response = await apiClient.patch<{
      success: boolean;
      message: string;
      data: AdminAiTemplate;
    }>(API_ENDPOINTS.ADMIN.AI_TEMPLATE_TOGGLE(id), { isActive });

    return response.data.data;
  }
}

export const adminAiService = new AdminAiService();

import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { AuditLogsResponse, AuditLogFilters } from '../types/audit.types';

class AuditService {
  async getAuditLogs(params: AuditLogFilters = {}): Promise<AuditLogsResponse> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: AuditLogsResponse;
    }>(API_ENDPOINTS.ADMIN.AUDIT_LOGS, { params });

    return response.data.data;
  }

  async restoreUser(userId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.ADMIN.RESTORE_USER(userId));
  }
}

export const auditService = new AuditService();

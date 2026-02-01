import type { PaginationMeta } from '@/lib/api/api.types';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'ROLE_CHANGE'
  | 'RESTORE'
  | 'UPLOAD'
  | 'VERIFY'
  | 'LOCK'
  | 'UNLOCK';

export type AuditEntityType =
  | 'USER'
  | 'TOUR'
  | 'COMPANY'
  | 'GUIDE'
  | 'DRIVER'
  | 'BOOKING'
  | 'REVIEW'
  | 'MEDIA'
  | 'LOCATION'
  | 'AUTH';

export interface AuditLog {
  id: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  items: AuditLog[];
  pagination: PaginationMeta;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}

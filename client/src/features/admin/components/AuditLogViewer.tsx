'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { RefreshCw, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import type { AuditLogFilters, AuditAction, AuditEntityType, AuditLog } from '../types/audit.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const AUDIT_ACTIONS: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'PASSWORD_CHANGE',
  'ROLE_CHANGE',
  'RESTORE',
  'UPLOAD',
  'VERIFY',
  'LOCK',
  'UNLOCK',
];

const ENTITY_TYPES: AuditEntityType[] = [
  'USER',
  'TOUR',
  'COMPANY',
  'GUIDE',
  'DRIVER',
  'BOOKING',
  'REVIEW',
  'MEDIA',
  'LOCATION',
  'AUTH',
];

const getActionBadgeVariant = (action: AuditAction) => {
  switch (action) {
    case 'CREATE':
    case 'RESTORE':
    case 'VERIFY':
    case 'UNLOCK':
      return 'default';
    case 'UPDATE':
    case 'UPLOAD':
    case 'ROLE_CHANGE':
      return 'secondary';
    case 'DELETE':
    case 'LOCK':
      return 'destructive';
    case 'LOGIN':
    case 'LOGOUT':
    case 'PASSWORD_CHANGE':
      return 'outline';
    default:
      return 'secondary';
  }
};

interface AuditLogDetailsProps {
  log: AuditLog;
}

const AuditLogDetails = ({ log }: AuditLogDetailsProps) => {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin.audit.details_title', 'Audit Log Details')}</DialogTitle>
          <DialogDescription>
            {t('admin.audit.details_description', 'Detailed information about this audit log entry.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t('admin.audit.action', 'Action')}</Label>
              <div className="mt-1">
                <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('admin.audit.entity_type', 'Entity Type')}</Label>
              <p className="font-medium">{log.entityType}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t('admin.audit.entity_id', 'Entity ID')}</Label>
              <p className="font-mono text-sm">{log.entityId || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('admin.audit.timestamp', 'Timestamp')}</Label>
              <p className="font-medium">{format(new Date(log.createdAt), 'PPpp')}</p>
            </div>
          </div>

          {log.user && (
            <div>
              <Label className="text-muted-foreground">{t('admin.audit.performed_by', 'Performed By')}</Label>
              <p className="font-medium">
                {log.user.firstName} {log.user.lastName} ({log.user.email})
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t('admin.audit.ip_address', 'IP Address')}</Label>
              <p className="font-mono text-sm">{log.ipAddress || '-'}</p>
            </div>
          </div>

          {log.userAgent && (
            <div>
              <Label className="text-muted-foreground">{t('admin.audit.user_agent', 'User Agent')}</Label>
              <p className="text-sm text-muted-foreground break-all">{log.userAgent}</p>
            </div>
          )}

          {log.details && Object.keys(log.details).length > 0 && (
            <div>
              <Label className="text-muted-foreground">{t('admin.audit.details', 'Details')}</Label>
              <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AuditLogViewer = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, refetch, isFetching } = useAuditLogs(filters);

  const handleFilterChange = useCallback((key: keyof AuditLogFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: key === 'page' ? (value as number) : 1, // Reset to page 1 when filters change
    }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ page: 1, limit: 20 });
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('admin.audit.title', 'Audit Logs')}</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('admin.audit.filters', 'Filters')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {showFilters && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/30 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="action">{t('admin.audit.action', 'Action')}</Label>
                <Select
                  value={filters.action || 'all'}
                  onValueChange={(value) => handleFilterChange('action', value)}
                >
                  <SelectTrigger id="action">
                    <SelectValue placeholder={t('admin.audit.all_actions', 'All Actions')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin.audit.all_actions', 'All Actions')}</SelectItem>
                    {AUDIT_ACTIONS.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="entityType">{t('admin.audit.entity_type', 'Entity Type')}</Label>
                <Select
                  value={filters.entityType || 'all'}
                  onValueChange={(value) => handleFilterChange('entityType', value)}
                >
                  <SelectTrigger id="entityType">
                    <SelectValue placeholder={t('admin.audit.all_entities', 'All Entities')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin.audit.all_entities', 'All Entities')}</SelectItem>
                    {ENTITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">{t('admin.audit.start_date', 'Start Date')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">{t('admin.audit.end_date', 'End Date')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {t('common.clear_filters', 'Clear Filters')}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('admin.audit.no_logs', 'No audit logs found.')}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.audit.timestamp', 'Timestamp')}</TableHead>
                    <TableHead>{t('admin.audit.user', 'User')}</TableHead>
                    <TableHead>{t('admin.audit.action', 'Action')}</TableHead>
                    <TableHead>{t('admin.audit.entity', 'Entity')}</TableHead>
                    <TableHead>{t('admin.audit.ip', 'IP')}</TableHead>
                    <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.createdAt), 'PP p')}
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <span className="text-sm">
                            {log.user.firstName} {log.user.lastName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {log.entityType}
                          {log.entityId && (
                            <span className="text-muted-foreground ml-1 font-mono text-xs">
                              ({log.entityId.slice(0, 8)}...)
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <AuditLogDetails log={log} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {t('common.showing_page', 'Page {{page}} of {{total}}', {
                    page: data.pagination.page,
                    total: data.pagination.totalPages,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                    disabled={!data.pagination.hasPreviousPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                    disabled={!data.pagination.hasNextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

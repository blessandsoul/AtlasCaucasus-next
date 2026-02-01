'use client';

import { useTranslation } from 'react-i18next';
import { Users, Mail, Calendar } from 'lucide-react';
import { useTourAgents } from '@/features/companies/hooks/useCompanies';
import { formatDate } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import type { ColumnDef } from '@/components/common/DataTable';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import type { TourAgent } from '@/features/companies/types/company.types';

export const CompanyAgentsTable = () => {
    const { t } = useTranslation();

    const { data: response, isLoading, error } = useTourAgents();

    const agents = response?.tourAgents || [];

    const columns: ColumnDef<TourAgent>[] = [
        {
            header: t('company.agents.table.agent', 'Agent'),
            cell: (agent) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                        {agent.firstName[0]}
                    </div>
                    <div className="min-w-0">
                        <div className="font-semibold truncate">{agent.firstName} {agent.lastName}</div>
                        <div className="text-xs text-muted-foreground hidden sm:block">ID: {agent.id.slice(0, 8)}...</div>
                    </div>
                </div>
            ),
            className: "w-[250px] font-medium"
        },
        {
            header: t('company.agents.table.contact', 'Contact'),
            cell: (agent) => (
                <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {agent.email}
                    </div>
                </div>
            )
        },
        {
            header: t('company.agents.table.status', 'Status'),
            cell: (agent) => (
                <Badge variant={agent.emailVerified ? "outline" : "secondary"} className={agent.emailVerified ? "text-green-600 border-green-200 bg-green-50" : "text-amber-600 bg-amber-50"}>
                    {agent.emailVerified ? t('common.verified', 'Verified') : t('common.pending', 'Pending')}
                </Badge>
            )
        },
        {
            header: t('company.agents.table.joined', 'Joined'),
            cell: (agent) => (
                <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(agent.createdAt)}
                </div>
            )
        }
    ];

    if (error) {
        return <ErrorMessage error={error} />;
    }

    return (
        <div className="space-y-6">
            <DataTable
                data={agents}
                columns={columns}
                isLoading={isLoading}
                emptyState={{
                    icon: Users,
                    title: t('company.agents.empty_state', 'No agents found'),
                    description: t('company.agents.empty_state_description', 'No agents found for your company.')
                }}
            />
        </div>
    );
};

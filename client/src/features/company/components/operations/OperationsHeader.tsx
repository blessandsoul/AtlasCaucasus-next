'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';

export const OperationsHeader = () => {
    const { t } = useTranslation();
    const pathname = usePathname();
    const router = useRouter();

    // Determine current tab based on path
    const currentTab = pathname.includes(ROUTES.OPERATIONS.TOURS)
        ? 'tours'
        : 'agents';

    const handleTabChange = (value: string) => {
        if (value === 'agents') {
            router.push(ROUTES.OPERATIONS.AGENTS);
        } else if (value === 'tours') {
            router.push(ROUTES.OPERATIONS.TOURS);
        }
    };

    const actionButton = currentTab === 'agents' ? {
        label: t('company.agents.add_new', 'Add Agent'),
        href: ROUTES.CREATE_AGENT
    } : {
        label: t('auth.create_tour', 'Create Tour'),
        href: ROUTES.TOURS.CREATE
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('company.operations.title', 'Operations')}
                </h1>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
                    <TabsList>
                        <TabsTrigger value="agents">
                            {t('company.operations.tabs.agents', 'Agents')}
                        </TabsTrigger>
                        <TabsTrigger value="tours">
                            {t('company.operations.tabs.tours', 'Tours')}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <Link href={actionButton.href}>
                    <Button className="gap-2 shadow-sm">
                        <Plus className="h-4 w-4" />
                        {actionButton.label}
                    </Button>
                </Link>
            </div>
        </div>
    );
};

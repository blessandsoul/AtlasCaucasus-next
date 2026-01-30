'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const InquiriesHeader = () => {
    const { t } = useTranslation();
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();

    // Check if user is a service provider (can receive inquiries)
    const isServiceProvider =
        user?.roles?.includes('GUIDE') ||
        user?.roles?.includes('DRIVER') ||
        user?.roles?.includes('COMPANY');

    // Determine current tab based on path
    const currentTab = pathname.includes(ROUTES.INQUIRIES.RECEIVED)
        ? 'received'
        : 'sent';

    const handleTabChange = (value: string) => {
        if (value === 'sent') {
            router.push(ROUTES.INQUIRIES.SENT);
        } else if (value === 'received') {
            router.push(ROUTES.INQUIRIES.RECEIVED);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('inquiries.title', 'Inquiries')}
                </h1>
                <p className="text-muted-foreground">
                    {t('inquiries.description', 'Manage your inquiries and communications')}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
                    <TabsList>
                        <TabsTrigger value="sent">
                            {t('inquiries.tabs.sent', 'Sent')}
                        </TabsTrigger>
                        {isServiceProvider && (
                            <TabsTrigger value="received">
                                {t('inquiries.tabs.received', 'Received')}
                            </TabsTrigger>
                        )}
                    </TabsList>
                </Tabs>

                <Link href={ROUTES.INQUIRIES.CREATE}>
                    <Button className="gap-2 shadow-sm">
                        <Plus className="h-4 w-4" />
                        {t('inquiries.new_inquiry', 'New Inquiry')}
                    </Button>
                </Link>
            </div>
        </div>
    );
};

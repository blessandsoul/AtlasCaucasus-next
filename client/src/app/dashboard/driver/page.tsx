'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DriverProfileTab } from '@/features/drivers/components/dashboard/DriverProfileTab';
import { DriverLocationsTab } from '@/features/drivers/components/dashboard/DriverLocationsTab';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/lib/constants/routes';
import Link from 'next/link';

export default function DriverDashboardPage(): React.ReactElement {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const user = useAppSelector((state) => state.auth.user);

  // Role protection: only DRIVER role can access this page
  if (user && !user.roles?.includes('DRIVER')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t('common.access_denied', 'Access Denied')}</CardTitle>
            <CardDescription>
              {t('driver.access_denied_desc', 'You need a driver account to access this page.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href={ROUTES.DASHBOARD}>{t('common.go_back', 'Go Back')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight">
        {t('driver.dashboard.title', 'Driver Dashboard')}
      </h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">{t('driver.dashboard.profile', 'Profile')}</TabsTrigger>
          <TabsTrigger value="locations">{t('driver.dashboard.locations', 'Locations')}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <DriverProfileTab />
        </TabsContent>
        <TabsContent value="locations" className="mt-6">
          <DriverLocationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

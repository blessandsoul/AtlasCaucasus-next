'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GuideProfileTab } from '@/features/guides/components/dashboard/GuideProfileTab';
import { GuideLocationsTab } from '@/features/guides/components/dashboard/GuideLocationsTab';

export default function GuideDashboardPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight">
        {t('guide.dashboard.title', 'Guide Dashboard')}
      </h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">{t('guide.dashboard.profile', 'Profile')}</TabsTrigger>
          <TabsTrigger value="locations">{t('guide.dashboard.locations', 'Locations')}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <GuideProfileTab />
        </TabsContent>
        <TabsContent value="locations" className="mt-6">
          <GuideLocationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

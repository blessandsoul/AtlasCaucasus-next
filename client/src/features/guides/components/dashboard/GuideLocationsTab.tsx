'use client';

import { useTranslation } from 'react-i18next';

export const GuideLocationsTab = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('guide.locations.title', 'Manage Locations')}</h2>
      <p className="text-muted-foreground">
        {t('guide.locations.coming_soon', 'Location management coming soon...')}
      </p>
    </div>
  );
};

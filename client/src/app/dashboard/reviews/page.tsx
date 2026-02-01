'use client';

import { useTranslation } from 'react-i18next';
import { MyReviews } from '@/features/reviews';

export default function ReviewsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('dashboard.reviews.title', 'My Reviews')}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.reviews.description', 'Manage your reviews for tours, guides, drivers, and companies.')}
        </p>
      </div>

      <MyReviews />
    </div>
  );
}

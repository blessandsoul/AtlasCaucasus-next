'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useGuide } from '@/features/guides/hooks/useGuides';
import { GuideHeader } from '@/features/guides/components/GuideHeader';
import { GuideInfo } from '@/features/guides/components/GuideInfo';
import { GuideSidebar } from '@/features/guides/components/GuideSidebar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { isValidUuid } from '@/lib/utils/validation';
import { getMediaUrl } from '@/lib/utils/media';

import { useTranslation } from 'react-i18next'; // Added import

export default function GuideDetailsPage() {
  const { t } = useTranslation(); // Added hook
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Validate UUID format before making API call
  const isValidId = isValidUuid(id);
  const { data: guide, isLoading, error } = useGuide(isValidId ? id : '');

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isValidId || error || !guide) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <h2 className="text-2xl font-bold text-foreground">{t('guide_details.not_found_title')}</h2>
        <p className="text-muted-foreground max-w-md">
          {t('guide_details.not_found_desc')}
        </p>
        <Button variant="outline" onClick={() => router.push('/explore/guides')}>
          {t('guide_details.back_to_guides')}
        </Button>
      </div>
    );
  }

  const handleBook = () => {
    console.log('Book guide:', guide.id);
  };

  const coverImage = guide.coverUrl
    ? getMediaUrl(guide.coverUrl)
    : '/default-covers/guide-cover.jpg';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Background */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gray-900">
          <img
            src={coverImage}
            alt="Background"
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 -mt-32 relative z-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm border border-white/10 rounded-full px-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        {/* Header Card */}
        <GuideHeader guide={guide} />

        {/* Content Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <GuideInfo guide={guide} />
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <GuideSidebar guide={guide} onBook={handleBook} />
            </div>
          </div>
        </div>

        {/* Mobile Sticky Footer */}
        <div className="lg:hidden">
          <GuideSidebar guide={guide} onBook={handleBook} />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useGuide } from '@/features/guides/hooks/useGuides';
import { GuideHeader } from '@/features/guides/components/GuideHeader';
import { GuideInfo } from '@/features/guides/components/GuideInfo';
import { GuideSidebar } from '@/features/guides/components/GuideSidebar';
import { RequestInquiryDialog } from '@/features/inquiries/components/RequestInquiryDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTrackView } from '@/features/analytics/hooks/useAnalytics';
import { isValidUuid } from '@/lib/utils/validation';
import { getMediaUrl } from '@/lib/utils/media';

export function GuideDetailsClient(): React.ReactElement {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAuthenticated } = useAuth();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const trackView = useTrackView();
  const viewTracked = useRef(false);

  // Validate UUID format before making API call
  const isValidId = isValidUuid(id);
  const { data: guide, isLoading, error } = useGuide(isValidId ? id : '');

  useEffect(() => {
    if (guide && !viewTracked.current) {
      viewTracked.current = true;
      trackView.mutate({ entityType: 'GUIDE', entityId: guide.id });
    }
  }, [guide]);

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

  const guideName = guide.user
    ? `${guide.user.firstName} ${guide.user.lastName}`
    : t('guide_details.unknown_guide');

  const handleBook = (): void => {
    if (!isAuthenticated) {
      toast.error(t('inquiry_dialog.login_required'));
      router.push(`/login?redirect=${encodeURIComponent(`/explore/guides/${id}`)}`);
      return;
    }
    setInquiryOpen(true);
  };

  const coverImage = guide.coverUrl
    ? getMediaUrl(guide.coverUrl)
    : '/default-covers/guide-cover.jpg';

  const languages = (() => {
    if (!guide.languages) return [];
    if (Array.isArray(guide.languages)) return guide.languages;
    if (typeof guide.languages === 'string') {
      try { const parsed = JSON.parse(guide.languages); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    }
    return [];
  })();

  const guideSubtitle = [
    languages.length ? languages.join(', ') : null,
    guide.pricePerDay ? `${guide.pricePerDay} ${guide.currency || 'USD'}/${t('guide_details.per_day')}` : null,
  ].filter(Boolean).join(' - ');

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

      {/* Inquiry Dialog */}
      <RequestInquiryDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        targetType="GUIDE"
        targetId={guide.id}
        entityTitle={guideName}
        entitySubtitle={guideSubtitle}
        defaultSubject={`${t('inquiry_dialog.subject_prefix_guide')}: ${guideName}`}
      />
    </div>
  );
}

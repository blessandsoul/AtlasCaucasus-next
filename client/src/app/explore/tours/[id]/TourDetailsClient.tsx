'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTour } from '@/features/tours/hooks/useTours';
import { TourHeader } from '@/features/tours/components/TourHeader';
import { TourGallery } from '@/features/tours/components/TourGallery';
import { TourSidebar } from '@/features/tours/components/TourSidebar';
import { TourInfo } from '@/features/tours/components/TourInfo';
import { ReviewsSection } from '@/features/reviews';
import { RelatedTours } from '@/features/tours/components/RelatedTours';
import { RequestInquiryDialog } from '@/features/inquiries/components/RequestInquiryDialog';
import { DirectBookingDialog } from '@/features/bookings/components/DirectBookingDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTrackView } from '@/features/analytics/hooks/useAnalytics';
import { getMediaUrl } from '@/lib/utils/media';
import { isValidUuid } from '@/lib/utils/validation';
import { useCurrency } from '@/context/CurrencyContext';

export function TourDetailsClient(): React.ReactElement {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const trackView = useTrackView();
  const viewTracked = useRef(false);

  const isValidId = isValidUuid(id);
  const { data: tour, isLoading, error } = useTour(isValidId ? id : '');

  useEffect(() => {
    if (tour && !viewTracked.current) {
      viewTracked.current = true;
      trackView.mutate({ entityType: 'TOUR', entityId: tour.id });
    }
  }, [tour]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isValidId || error || !tour) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Tour not found</h2>
        <p className="text-muted-foreground">
          The tour you are looking for does not exist or has been removed.
        </p>
        <Button variant="outline" onClick={() => router.push('/explore/tours')}>
          Back to Tours
        </Button>
      </div>
    );
  }

  const handleBook = (): void => {
    if (!isAuthenticated) {
      toast.error(t('inquiry_dialog.login_required'));
      router.push(`/login?redirect=${encodeURIComponent(`/explore/tours/${id}`)}`);
      return;
    }
    setBookingOpen(true);
  };

  const handleAskQuestion = (): void => {
    if (!isAuthenticated) {
      toast.error(t('inquiry_dialog.login_required'));
      router.push(`/login?redirect=${encodeURIComponent(`/explore/tours/${id}`)}`);
      return;
    }
    setInquiryOpen(true);
  };

  const priceDisplay = `${formatPrice(parseFloat(tour.price), tour.currency)}${tour.city ? ` - ${tour.city}` : ''}`;

  return (
    <div className="container mx-auto pt-4 lg:pt-28 pb-8 px-4 md:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 hover:bg-transparent hover:text-primary pl-0"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <TourHeader tour={tour} />

      <TourGallery images={tour.images} className="mt-6 md:mt-8" />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-2">
          <TourInfo tour={tour} />
        </div>

        <div className="lg:col-span-1">
          <TourSidebar tour={tour} onBook={handleBook} onAskQuestion={handleAskQuestion} />
        </div>
      </div>

      <ReviewsSection
        targetType="TOUR"
        targetId={id}
        className="mt-8 md:mt-12"
      />

      <RelatedTours tourId={tour.id} />

      <DirectBookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        tour={{
          tourId: tour.id,
          tourName: tour.title,
          tourImage: tour.images?.[0]?.url ? getMediaUrl(tour.images[0].url) : null,
          price: parseFloat(tour.price),
          currency: tour.currency,
          maxPeople: tour.maxPeople,
          availabilityType: tour.availabilityType,
          availableDates: tour.availableDates,
        }}
      />

      <RequestInquiryDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        targetType="TOUR"
        targetId={tour.id}
        entityTitle={tour.title}
        entitySubtitle={priceDisplay}
        defaultSubject={`${t('inquiry_dialog.subject_prefix_tour')}: ${tour.title}`}
      />
    </div>
  );
}

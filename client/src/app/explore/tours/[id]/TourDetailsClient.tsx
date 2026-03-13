'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTour } from '@/features/tours/hooks/useTours';
import { TourHeader } from '@/features/tours/components/TourHeader';
import { TourGallery } from '@/features/tours/components/TourGallery';
import { TourSidebar } from '@/features/tours/components/TourSidebar';
import { StickyNavBar } from '@/features/tours/components/StickyNavBar';
import { TourAbout, TourItinerary } from '@/features/tours/components/TourInfo';
import { ReviewsSection } from '@/features/reviews';
import { RelatedTours } from '@/features/tours/components/RelatedTours';
import { RequestInquiryDialog } from '@/features/inquiries/components/RequestInquiryDialog';
import { DirectBookingDialog } from '@/features/bookings/components/DirectBookingDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
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
  const [galleryBottom, setGalleryBottom] = useState(600);
  const trackView = useTrackView();
  const viewTracked = useRef(false);
  const galleryEndRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const itineraryRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  const isValidId = isValidUuid(id);
  const { data: tour, isLoading, error } = useTour(isValidId ? id : '');

  useEffect(() => {
    if (tour && !viewTracked.current) {
      viewTracked.current = true;
      trackView.mutate({ entityType: 'TOUR', entityId: tour.id });
    }
  }, [tour]);

  // Measure gallery bottom for sticky nav visibility
  useEffect(() => {
    const measure = (): void => {
      if (galleryEndRef.current) {
        const rect = galleryEndRef.current.getBoundingClientRect();
        setGalleryBottom(rect.bottom + window.scrollY);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [tour]);

  const navSections = useMemo(() => [
    { id: 'overview', label: t('tours.detail.overview', 'Overview'), ref: aboutRef },
    { id: 'itinerary', label: t('tours.detail.itinerary', 'Itinerary'), ref: itineraryRef },
    { id: 'reviews', label: t('tours.detail.reviews', 'Reviews'), ref: reviewsRef },
  ], [t]);

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

  const scrollToReviews = (): void => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const price = parseFloat(tour.price);
  const originalPrice = tour.originalPrice ? parseFloat(tour.originalPrice) : null;
  const hasDiscount = originalPrice !== null && originalPrice > price;
  const priceDisplay = `${formatPrice(price, tour.currency)}${tour.city ? ` - ${tour.city}` : ''}`;

  return (
    <>
      {/* Sticky section nav — desktop only, appears on scroll */}
      <StickyNavBar
        sections={navSections}
        price={formatPrice(price, tour.currency)}
        ctaLabel={
          tour.availabilityType === 'BY_REQUEST'
            ? t('bookings.request_booking', 'Request Booking')
            : t('bookings.reserve', 'Reserve')
        }
        onReserve={handleBook}
        showAfterOffset={galleryBottom}
      />

      <div className="pb-24 lg:pb-8">
        {/* Gallery - full width, at the top */}
        <div className="container mx-auto px-4 md:px-6 pt-4 lg:pt-28">
          <TourGallery images={tour.images} />
        </div>
        {/* Measure point for sticky nav visibility */}
        <div ref={galleryEndRef} />

        {/* Content container */}
        <div className="container mx-auto px-4 md:px-6 pt-6">
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to tours</span>
          </button>

          {/* Title area */}
          <TourHeader tour={tour} onReviewsClick={scrollToReviews} />

          <Separator className="mt-8" />

          {/* Two-column layout */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
            {/* Left column - main content */}
            <div>
              <div ref={aboutRef} id="overview-section" className="scroll-mt-20">
                <TourAbout tour={tour} />
              </div>

              {tour.itinerary && tour.itinerary.length > 0 && (
                <>
                  <Separator className="my-12" />
                  <div ref={itineraryRef} id="itinerary-section" className="scroll-mt-20">
                    <TourItinerary itinerary={tour.itinerary} />
                  </div>
                </>
              )}

              <Separator className="my-12" />
              <div ref={reviewsRef} id="reviews-section" className="scroll-mt-20">
                <ReviewsSection
                  targetType="TOUR"
                  targetId={id}
                />
              </div>
            </div>

            {/* Right column - sidebar */}
            <div>
              <TourSidebar tour={tour} onBook={handleBook} onAskQuestion={handleAskQuestion} />
            </div>
          </div>

          {/* Related tours - full width */}
          <RelatedTours tourId={tour.id} />
        </div>
      </div>

      {/* Mobile sticky booking bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t bg-background/95 backdrop-blur-sm px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-4 max-w-screen-xl mx-auto">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              {hasDiscount && originalPrice && (
                <span className="text-xs text-muted-foreground line-through mr-1">
                  {formatPrice(originalPrice, tour.currency)}
                </span>
              )}
              <span className="text-lg font-bold text-foreground">
                {formatPrice(price, tour.currency)}
              </span>
              <span className="text-sm text-muted-foreground">/ person</span>
            </div>
            {tour.hasFreeCancellation && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Free cancellation</span>
            )}
          </div>
          <Button
            size="lg"
            className="font-semibold shadow-md shrink-0"
            onClick={handleBook}
          >
            {tour.availabilityType === 'BY_REQUEST'
              ? t('bookings.request_booking', 'Request Booking')
              : t('bookings.reserve', 'Reserve')}
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <DirectBookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        tour={{
          tourId: tour.id,
          tourName: tour.title,
          tourImage: tour.images?.[0]?.url ? getMediaUrl(tour.images[0].url) : null,
          price: price,
          currency: tour.currency,
          maxPeople: tour.maxPeople,
          availabilityType: tour.availabilityType,
          availableDates: tour.availableDates,
          nextAvailableDate: tour.nextAvailableDate,
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
    </>
  );
}

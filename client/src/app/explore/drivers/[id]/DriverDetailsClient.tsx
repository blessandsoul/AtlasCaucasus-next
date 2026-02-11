'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useDriver } from '@/features/drivers/hooks/useDrivers';
import { DriverHeader } from '@/features/drivers/components/DriverHeader';
import { DriverInfo } from '@/features/drivers/components/DriverInfo';
import { DriverSidebar } from '@/features/drivers/components/DriverSidebar';
import { RequestInquiryDialog } from '@/features/inquiries/components/RequestInquiryDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTrackView } from '@/features/analytics/hooks/useAnalytics';
import { isValidUuid } from '@/lib/utils/validation';
import { getMediaUrl } from '@/lib/utils/media';

export function DriverDetailsClient(): React.ReactElement {
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
  const { data: driver, isLoading, error } = useDriver(isValidId ? id : '');

  useEffect(() => {
    if (driver && !viewTracked.current) {
      viewTracked.current = true;
      trackView.mutate({ entityType: 'DRIVER', entityId: driver.id });
    }
  }, [driver]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isValidId || error || !driver) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <h2 className="text-2xl font-bold text-foreground">
          {t('driver_details.not_found.title', 'Driver not found')}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {t('driver_details.not_found.description', 'The driver you are looking for does not exist or has been removed.')}
        </p>
        <Button variant="outline" onClick={() => router.push('/explore/drivers')}>
          {t('driver_details.not_found.back_to_list', 'Back to Drivers')}
        </Button>
      </div>
    );
  }

  const driverName = driver.user
    ? `${driver.user.firstName} ${driver.user.lastName}`
    : t('driver_details.unknown_driver');

  const handleBook = (): void => {
    if (!isAuthenticated) {
      toast.error(t('inquiry_dialog.login_required'));
      router.push(`/login?redirect=${encodeURIComponent(`/explore/drivers/${id}`)}`);
      return;
    }
    setInquiryOpen(true);
  };

  const coverImage = driver.coverUrl
    ? getMediaUrl(driver.coverUrl)
    : '/default-covers/driver-cover.jpg';

  const driverSubtitle = [
    `${driver.vehicleMake} ${driver.vehicleModel}`,
    driver.pricePerDay ? `${driver.pricePerDay} ${driver.currency || 'USD'}/${t('guide_details.per_day')}` : null,
  ].filter(Boolean).join(' - ');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Background */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gray-900">
          <img
            src={coverImage}
            alt="Driving Background"
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
          {t('driver_details.back', 'Back')}
        </Button>

        {/* Header Card */}
        <DriverHeader driver={driver} />

        {/* Content Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <DriverInfo driver={driver} />
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <DriverSidebar driver={driver} onBook={handleBook} />
            </div>
          </div>
        </div>

        {/* Mobile Sticky Footer */}
        <div className="lg:hidden">
          <DriverSidebar driver={driver} onBook={handleBook} />
        </div>
      </div>

      {/* Inquiry Dialog */}
      <RequestInquiryDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        targetType="DRIVER"
        targetId={driver.id}
        entityTitle={driverName}
        entitySubtitle={driverSubtitle}
        defaultSubject={`${t('inquiry_dialog.subject_prefix_driver')}: ${driverName}`}
      />
    </div>
  );
}

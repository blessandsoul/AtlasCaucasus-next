'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTour } from '@/features/tours/hooks/useTours';
import { TourHeader } from '@/features/tours/components/TourHeader';
import { TourGallery } from '@/features/tours/components/TourGallery';
import { TourSidebar } from '@/features/tours/components/TourSidebar';
import { TourInfo } from '@/features/tours/components/TourInfo';
import { ReviewsSection } from '@/features/reviews';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';

export default function TourDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: tour, isLoading, error } = useTour(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !tour) {
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

  const handleBook = () => {
    console.log('Book clicked', tour.id);
  };

  return (
    <div className="container mx-auto pt-4 lg:pt-28 pb-8 px-4 md:px-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 hover:bg-transparent hover:text-primary pl-0"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <TourHeader tour={tour} />

      {/* Gallery */}
      <TourGallery images={tour.images} className="mt-6 md:mt-8" />

      {/* Main Content Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        {/* Left Column: Info, Desc, etc. */}
        <div className="lg:col-span-2">
          <TourInfo tour={tour} />
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-1">
          <TourSidebar tour={tour} onBook={handleBook} />
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewsSection
        targetType="TOUR"
        targetId={id}
        className="mt-8 md:mt-12"
      />
    </div>
  );
}

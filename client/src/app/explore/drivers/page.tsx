'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DriverCard } from '@/features/drivers/components/DriverCard';
import { Pagination } from '@/components/common/Pagination';
import { useDrivers } from '@/features/drivers/hooks/useDrivers';

function ExploreDriversContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get params from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || undefined;
  const vehicleType = searchParams.get('vehicleType') || undefined;
  const locationId = searchParams.get('locationId') || undefined;
  const sortBy = searchParams.get('sortBy') as 'newest' | 'rating' | 'capacity' | undefined || undefined;
  const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
  const minCapacity = searchParams.get('minCapacity') ? Number(searchParams.get('minCapacity')) : undefined;

  // Handler to update page in URL
  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Fetch drivers with current URL parameters
  const { data: driversData, isLoading, error } = useDrivers({
    page,
    limit: 12,
    search,
    vehicleType,
    locationId,
    sortBy,
    minRating,
    minCapacity
  });

  return (
    <div className="lg:col-span-3 w-full">
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 dark:text-red-400 mb-2">Failed to load drivers</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      )}

      {driversData && !isLoading && (
        <>
          {driversData.items.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 text-lg">No drivers found</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                  Try adjusting your filters or check back later
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 min-[500px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {driversData.items.map((driver) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                  />
                ))}
              </div>

              {driversData.pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    page={driversData.pagination.page}
                    totalPages={driversData.pagination.totalPages}
                    hasNextPage={driversData.pagination.hasNextPage}
                    hasPreviousPage={driversData.pagination.hasPreviousPage}
                    onChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function ExploreDriversLoading() {
  return (
    <div className="lg:col-span-3 w-full flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

export default function ExploreDriversPage() {
  return (
    <Suspense fallback={<ExploreDriversLoading />}>
      <ExploreDriversContent />
    </Suspense>
  );
}

'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { TourCard } from '@/features/tours/components/TourCard';
import { Pagination } from '@/components/common/Pagination';
import { useTours } from '@/features/tours/hooks/useTours';

function ExploreToursContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Get params from URL
    const page = parseInt(searchParams.get('page') || '1', 10);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const sortBy = searchParams.get('sortBy') as 'newest' | 'rating' | 'price' | 'price_desc' | undefined || undefined;
    const locationId = searchParams.get('locationId') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;
    const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
    const minDuration = searchParams.get('minDuration') ? Number(searchParams.get('minDuration')) : undefined;
    const maxDuration = searchParams.get('maxDuration') ? Number(searchParams.get('maxDuration')) : undefined;
    const maxPeople = searchParams.get('maxPeople') ? Number(searchParams.get('maxPeople')) : undefined;
    const isFeatured = searchParams.get('isFeatured') === 'true' ? true : undefined;

    // Handler to update page in URL
    const handlePageChange = useCallback((newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname, searchParams]);

    // Fetch tours with current URL parameters
    const { data, isLoading, error } = useTours({
        page,
        limit: 12,
        search,
        category,
        minPrice,
        maxPrice,
        sortBy,
        locationId,
        difficulty,
        minRating,
        minDuration,
        maxDuration,
        maxPeople,
        isFeatured
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
                        <p className="text-red-500 dark:text-red-400 mb-2">Failed to load tours</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {error instanceof Error ? error.message : 'Unknown error'}
                        </p>
                    </div>
                </div>
            )}

            {data && !isLoading && (
                <>
                    {data.items.length === 0 ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <p className="text-gray-600 dark:text-gray-400 text-lg">No tours found</p>
                                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                                    Try adjusting your filters
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 min-[500px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.items.map((tour) => (
                                    <TourCard
                                        key={tour.id}
                                        tour={tour}
                                        onFavorite={(id) => console.log('Toggle favorite', id)}
                                    />
                                ))}
                            </div>

                            {data.pagination.totalPages > 1 && (
                                <Pagination
                                    page={data.pagination.page}
                                    totalPages={data.pagination.totalPages}
                                    hasNextPage={data.pagination.hasNextPage}
                                    hasPreviousPage={data.pagination.hasPreviousPage}
                                    onChange={handlePageChange}
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}

function ExploreToursLoading() {
    return (
        <div className="lg:col-span-3 w-full flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}

export default function ExploreToursPage() {
    return (
        <Suspense fallback={<ExploreToursLoading />}>
            <ExploreToursContent />
        </Suspense>
    );
}

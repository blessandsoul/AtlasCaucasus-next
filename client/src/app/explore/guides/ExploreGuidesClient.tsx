'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { GuideCard } from '@/features/guides/components/GuideCard';
import { FloatingCompareBar } from '@/features/guides/components/FloatingCompareBar';
import { Pagination } from '@/components/common/Pagination';
import { useGuides } from '@/features/guides/hooks/useGuides';
import { useFavoriteCheck, useToggleFavorite } from '@/features/favorites/hooks/useFavorites';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCompareSelection } from '@/hooks/useCompareSelection';

function ExploreGuidesContent(): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Get params from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || undefined;
  const language = searchParams.get('language') || undefined;
  const minExperience = searchParams.get('minExperience') ? Number(searchParams.get('minExperience')) : undefined;
  const locationId = searchParams.get('locationId') || undefined;
  const sortBy = searchParams.get('sortBy') as 'newest' | 'rating' | 'experience' | 'price' | 'price_desc' | undefined || undefined;
  const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

  // Handler to update page in URL
  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const { selectedItems, isSelected, toggle, remove, clear } =
    useCompareSelection('compare-guides', 3, 'guides');

  // Fetch guides with current URL parameters
  const { data, isLoading, error } = useGuides({
    page,
    limit: 12,
    search,
    language,
    minExperience,
    locationId,
    sortBy,
    minRating,
    minPrice,
    maxPrice
  });

  // Batch check favorites for all visible guides
  const guideIds = useMemo(
    () => data?.items.map((guide) => guide.id) ?? [],
    [data?.items]
  );
  const { data: favoritedSet } = useFavoriteCheck('GUIDE', guideIds);
  const toggleFavorite = useToggleFavorite();

  const handleFavorite = useCallback((id: string) => {
    if (!isAuthenticated) {
      toast.error(t('favorites.login_required', 'Please log in to save favorites'));
      router.push(`/login?redirect=${pathname}`);
      return;
    }
    toggleFavorite.mutate({
      entityType: 'GUIDE',
      entityId: id,
      isFavorited: favoritedSet?.has(id) ?? false,
    });
  }, [isAuthenticated, favoritedSet, toggleFavorite, router, pathname, t]);

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
            <p className="text-red-500 dark:text-red-400 mb-2">Failed to load guides</p>
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
                <p className="text-gray-600 dark:text-gray-400 text-lg">No guides found</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                  Try adjusting your filters or check back later
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 min-[500px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(data.items) && data.items.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    isFavorited={favoritedSet?.has(guide.id) ?? false}
                    onFavorite={handleFavorite}
                    isCompareSelected={isSelected(guide.id)}
                    onCompareToggle={toggle}
                  />
                ))}
              </div>

              {data.pagination?.totalPages > 1 && (
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
      {selectedItems.length > 0 && (
        <FloatingCompareBar
          selectedItems={selectedItems}
          onRemove={remove}
          onClear={clear}
        />
      )}
    </div>
  );
}

function ExploreGuidesLoading(): React.ReactElement {
  return (
    <div className="lg:col-span-3 w-full flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

export function ExploreGuidesClient(): React.ReactElement {
  return (
    <Suspense fallback={<ExploreGuidesLoading />}>
      <ExploreGuidesContent />
    </Suspense>
  );
}

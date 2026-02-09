'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo, Suspense } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { CompanyCard } from '@/features/companies/components/CompanyCard';
import { FloatingCompareBar } from '@/features/companies/components/FloatingCompareBar';
import { Pagination } from '@/components/common/Pagination';
import { useCompanies } from '@/features/companies/hooks/useCompanies';
import { useFavoriteCheck, useToggleFavorite } from '@/features/favorites/hooks/useFavorites';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCompareSelection } from '@/hooks/useCompareSelection';
import { AlertCircle, Loader2 } from 'lucide-react';

function ExploreCompaniesContent(): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Get params from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || undefined;
  const locationId = searchParams.get('locationId') || undefined;
  const sortBy = searchParams.get('sortBy') as 'newest' | 'rating' | 'name' | undefined || undefined;
  const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
  const hasActiveTours = searchParams.get('hasActiveTours') === 'true' ? true : undefined;

  const { data, isLoading, error } = useCompanies({
    page,
    limit: 12,
    search,
    locationId,
    sortBy,
    minRating,
    hasActiveTours
  });

  const companies = data?.items ?? [];

  // Batch check favorites for all visible companies
  const companyIds = useMemo(
    () => companies.map((company) => company.id),
    [companies]
  );
  const { data: favoritedSet } = useFavoriteCheck('COMPANY', companyIds);
  const toggleFavorite = useToggleFavorite();

  const handleFavorite = useCallback((id: string) => {
    if (!isAuthenticated) {
      toast.error(t('favorites.login_required', 'Please log in to save favorites'));
      router.push(`/login?redirect=${pathname}`);
      return;
    }
    toggleFavorite.mutate({
      entityType: 'COMPANY',
      entityId: id,
      isFavorited: favoritedSet?.has(id) ?? false,
    });
  }, [isAuthenticated, favoritedSet, toggleFavorite, router, pathname, t]);

  const { selectedItems, isSelected, toggle, remove, clear } =
    useCompareSelection('compare-companies', 3, 'companies');

  // Handler to update page in URL
  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  if (isLoading) {
    return (
      <div className="lg:col-span-3 w-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:col-span-3 w-full flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground">Failed to load companies</p>
      </div>
    );
  }

  return (
    <div className="lg:col-span-3 w-full animate-fade-in">

      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <p className="text-muted-foreground">No companies found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 min-[500px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                isFavorited={favoritedSet?.has(company.id) ?? false}
                onFavorite={handleFavorite}
                isCompareSelected={isSelected(company.id)}
                onCompareToggle={toggle}
              />
            ))}
          </div>

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                hasNextPage={data.pagination.hasNextPage}
                hasPreviousPage={data.pagination.hasPreviousPage}
                onChange={handlePageChange}
              />
            </div>
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

function ExploreCompaniesLoading(): React.ReactElement {
  return (
    <div className="lg:col-span-3 w-full flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

export function ExploreCompaniesClient(): React.ReactElement {
  return (
    <Suspense fallback={<ExploreCompaniesLoading />}>
      <ExploreCompaniesContent />
    </Suspense>
  );
}

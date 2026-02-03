'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, Suspense } from 'react';
import { CompanyCard } from '@/features/companies/components/CompanyCard';
import { Pagination } from '@/components/common/Pagination';
import { useCompanies } from '@/features/companies/hooks/useCompanies';
import { AlertCircle, Loader2 } from 'lucide-react';

function ExploreCompaniesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
              <CompanyCard key={company.id} company={company} />
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
    </div>
  );
}

function ExploreCompaniesLoading() {
  return (
    <div className="lg:col-span-3 w-full flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

export default function ExploreCompaniesPage() {
  return (
    <Suspense fallback={<ExploreCompaniesLoading />}>
      <ExploreCompaniesContent />
    </Suspense>
  );
}

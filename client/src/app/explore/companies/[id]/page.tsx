'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCompany } from '@/features/companies/hooks/useCompanies';
import { useCompanyTours } from '@/features/tours/hooks/useTours';
import { TourCard } from '@/features/tours/components/TourCard';
import { ReviewsSection } from '@/features/reviews';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Globe,
  Phone,
  Mail,
  CheckCircle,
  Calendar,
  Building2,
  Share2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { getMediaUrl } from '@/lib/utils/media';
import { useCallback } from 'react';
import { ChatButton } from '@/features/chat/components/ChatButton';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function CompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const activeTab = searchParams.get('tab') || 'about';
  const toursPage = parseInt(searchParams.get('toursPage') || '1', 10);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const toursLimit = isMobile ? 10 : 3;

  const { data: company, isLoading, error } = useCompany(id);
  const { data: toursData, isLoading: isToursLoading } = useCompanyTours(id, {
    page: isMobile ? 1 : toursPage,
    limit: toursLimit,
  });

  const handleTabChange = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      if (tab !== 'tours') {
        params.delete('toursPage');
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleToursPageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('toursPage', page.toString());
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Company not found</h2>
        <p className="text-muted-foreground">
          The company you are looking for does not exist or has been removed.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push('/explore/companies')}
        >
          Back to Companies
        </Button>
      </div>
    );
  }

  const logoUrl = company.logoUrl ? getMediaUrl(company.logoUrl) : null;
  const coverImage =
    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1920&q=80';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative h-[400px] w-full group overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-black/30" />
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 -mt-20 md:-mt-32">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/10 rounded-full px-4 transition-all"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Logo Card */}
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl bg-background p-1.5 shadow-2xl shadow-black/20 flex-shrink-0">
            <div className="w-full h-full rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center relative">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={company.companyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-16 h-16 text-muted-foreground/30" />
              )}
            </div>
          </div>

          {/* Header Info */}
          <div className="flex-1 pt-2 md:pt-12 text-foreground">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                    {company.companyName}
                  </h1>
                  {company.isVerified && (
                    <div className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-blue-500/20">
                      <CheckCircle className="w-3 h-3" />
                      VERIFIED
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(company.createdAt)}</span>
                  </div>
                  {company.registrationNumber && (
                    <div className="flex items-center gap-1.5">
                      <span>Reg: {company.registrationNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 md:mt-0">
                <ChatButton
                  otherUserId={company.userId}
                  label="Contact"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                />
                <Button variant="secondary" size="icon" className="shadow-md">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Tabs & Content */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="w-full justify-start h-12 bg-transparent border-b border-border rounded-none p-0 gap-6">
                <TabsTrigger
                  value="about"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-base"
                >
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="tours"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-base"
                >
                  Tours
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-base"
                >
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-8 space-y-8">
                <div className="prose prose-stone dark:prose-invert max-w-none">
                  <h3 className="text-xl font-semibold mb-4">
                    About {company.companyName}
                  </h3>
                  {company.description ? (
                    <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                      {company.description}
                    </p>
                  ) : (
                    <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground bg-muted/30">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>This company hasn&apos;t added a description yet.</p>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Tours',
                      value:
                        toursData?.pagination.totalItems?.toString() || '0',
                    },
                    { label: 'Reviews', value: '0' },
                    { label: 'Rating', value: 'N/A' },
                    { label: 'Response', value: '100%' },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-card border rounded-xl p-4 text-center hover:border-primary/50 transition-colors cursor-default"
                    >
                      <div className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tours" className="mt-8">
                {isToursLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : toursData && toursData.items.length > 0 ? (
                  <div className="space-y-6">
                    {/* Mobile: Horizontal Scroll */}
                    <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
                      {toursData.items.map((tour) => (
                        <div key={tour.id} className="snap-center shrink-0 w-[85vw]">
                          <TourCard tour={tour} />
                        </div>
                      ))}
                    </div>

                    {/* Tablet/Desktop: Grid */}
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
                      {toursData.items.map((tour) => (
                        <TourCard key={tour.id} tour={tour} />
                      ))}
                    </div>

                    {/* Pagination - Hide on Mobile */}
                    {!isMobile && toursData.pagination.totalPages > 1 && (
                      <Pagination
                        page={toursData.pagination.page}
                        totalPages={toursData.pagination.totalPages}
                        hasNextPage={toursData.pagination.hasNextPage}
                        hasPreviousPage={toursData.pagination.hasPreviousPage}
                        onChange={handleToursPageChange}
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-12 border border-dashed rounded-lg text-center text-muted-foreground bg-muted/30">
                    <p>No active tours listed.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-8">
                <ReviewsSection
                  targetType="COMPANY"
                  targetId={id}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {company.websiteUrl && (
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-0.5">
                        Website
                      </p>
                      <a
                        href={company.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline break-all"
                      >
                        {company.websiteUrl
                          .replace(/^https?:\/\//, '')
                          .replace(/\/$/, '')}
                      </a>
                    </div>
                  </div>
                )}

                {company.phoneNumber && (
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-0.5">
                        Phone
                      </p>
                      <a
                        href={`tel:${company.phoneNumber}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {company.phoneNumber}
                      </a>
                    </div>
                  </div>
                )}

                {company.user?.email && (
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-0.5">
                        Email
                      </p>
                      <a
                        href={`mailto:${company.user.email}`}
                        className="text-sm font-medium hover:text-primary transition-colors break-all"
                      >
                        {company.user.email}
                      </a>
                    </div>
                  </div>
                )}

                <div className="pt-4 mt-2 border-t">
                  <Button variant="outline" className="w-full">
                    View All Listings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Verified Partner Card */}
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Verified Partner
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      This company has been verified by Atlas Caucasus for
                      quality and reliability.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useCompany } from '@/features/companies/hooks/useCompanies';
import { useCompanyTours } from '@/features/tours/hooks/useTours';
import { TourCard } from '@/features/tours/components/TourCard';
import { ReviewsSection, useReviewStats } from '@/features/reviews';
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
  ShieldCheck,
  Clock,
  Calendar,
  Building2,
  Send,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { formatDate, formatResponseTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media';
import { useState, useCallback, Suspense } from 'react';
import { toast } from 'sonner';
import { ChatButton } from '@/features/chat/components/ChatButton';
import { RequestInquiryDialog } from '@/features/inquiries/components/RequestInquiryDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ShareButton } from '@/components/common/ShareButton';
import { ImageGallery } from '@/components/common/ImageGallery';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { isValidUuid } from '@/lib/utils/validation';

function CompanyDetailsContent(): React.ReactElement {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { isAuthenticated } = useAuth();
  const [inquiryOpen, setInquiryOpen] = useState(false);

  // Validate UUID format before making API calls
  const isValidId = isValidUuid(id);

  const activeTab = searchParams.get('tab') || 'about';
  const toursPage = parseInt(searchParams.get('toursPage') || '1', 10);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const toursLimit = isMobile ? 10 : 3;

  const { data: company, isLoading, error } = useCompany(isValidId ? id : '');
  const { data: toursData, isLoading: isToursLoading } = useCompanyTours(
    isValidId ? id : '',
    {
      page: isMobile ? 1 : toursPage,
      limit: toursLimit,
    }
  );
  const { data: reviewStats } = useReviewStats('COMPANY', isValidId ? id : '');

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

  const handleInquiry = useCallback(() => {
    if (!isAuthenticated) {
      toast.error(t('inquiry_dialog.login_required', 'Please log in to send an inquiry'));
      router.push(`/login?redirect=${encodeURIComponent(`/explore/companies/${id}`)}`);
      return;
    }
    setInquiryOpen(true);
  }, [isAuthenticated, router, id, t]);

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

  if (!isValidId || error || !company) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">{t('company_details.not_found_title')}</h2>
        <p className="text-muted-foreground">
          {t('company_details.not_found_desc')}
        </p>
        <Button
          variant="outline"
          onClick={() => router.push('/explore/companies')}
        >
          {t('company_details.back_to_companies')}
        </Button>
      </div>
    );
  }

  const logoUrl = company.logoUrl ? getMediaUrl(company.logoUrl) : null;
  const coverImage = company.coverUrl
    ? getMediaUrl(company.coverUrl)
    : '/default-covers/company-cover.jpg';

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
          {t('common.back')}
        </Button>

        <div className="flex flex-col items-center md:items-stretch md:flex-row gap-6 md:gap-8">
          {/* Logo Card */}
          <div className="w-44 h-44 md:w-48 md:h-48 rounded-2xl bg-background p-1.5 shadow-2xl shadow-black/20 flex-shrink-0">
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
          <div className="flex-1 min-w-0 w-full flex flex-col items-center md:items-stretch pt-2 md:pt-12 text-foreground">
            <div className="flex flex-col items-center md:items-start md:flex-row md:justify-between gap-4 w-full flex-1">
              <div className="flex flex-col items-center md:items-start justify-between h-full flex-1">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                    {company.companyName}
                  </h1>
                  <div className="flex items-center flex-wrap gap-2">
                    {company.isVerified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-500/20" title={t('provider_badges.verified_tooltip', 'This provider has been verified by AtlasCaucasus for identity and quality.')}>
                        <ShieldCheck className="h-4 w-4" />
                        {t('provider_badges.verified', 'Verified')}
                      </span>
                    )}
                    {(() => {
                      const rt = formatResponseTime(company.avgResponseTimeMinutes);
                      if (!rt) return null;
                      return (
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
                          rt.variant === 'success' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                          rt.variant === 'warning' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                          rt.variant === 'muted' && 'bg-muted text-muted-foreground border-border',
                        )}>
                          <Clock className="h-4 w-4" />
                          {t('provider_badges.responds', 'Responds')} {rt.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-start gap-1 text-sm text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(company.createdAt)}</span>
                  </div>
                  {company.registrationNumber && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      <span>{company.registrationNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0">
                <Button
                  onClick={handleInquiry}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white dark:text-black font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {t('inquiry_dialog.contact_company', 'Send Inquiry')}
                </Button>
                <ChatButton
                  otherUserId={company.userId}
                  label={t('company_details.contact')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                />
                <ShareButton
                  url={`/explore/companies/${id}`}
                  title={company.companyName}
                  description={company.description || undefined}
                />
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
                  {t('guide_details.tabs.about')}
                </TabsTrigger>
                <TabsTrigger
                  value="tours"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-base"
                >
                  {t('guide_details.tabs.tours')}
                </TabsTrigger>
                {company.images && company.images.length > 0 && (
                  <TabsTrigger
                    value="photos"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-base"
                  >
                    <ImageIcon className="w-4 h-4 mr-1.5" />
                    {t('company_details.tabs.photos', 'Photos')}
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-base"
                >
                  {t('guide_details.tabs.reviews')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-8 space-y-8">
                <div className="prose prose-stone dark:prose-invert max-w-none">
                  <h3 className="text-xl font-semibold mb-4">
                    {t('company_details.about_company', { name: company.companyName })}
                  </h3>
                  {company.description ? (
                    <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                      {company.description}
                    </p>
                  ) : (
                    <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground bg-muted/30">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>{t('company_details.no_description')}</p>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      label: t('company_details.stats.tours'),
                      value:
                        toursData?.pagination.totalItems?.toString() || '0',
                    },
                    {
                      label: t('company_details.stats.reviews'),
                      value: reviewStats?.reviewCount?.toString() || '0',
                    },
                    {
                      label: t('company_details.stats.rating'),
                      value: reviewStats?.averageRating
                        ? reviewStats.averageRating.toFixed(1)
                        : 'N/A',
                    },
                    {
                      label: t('company_details.stats.response'),
                      value: formatResponseTime(company.avgResponseTimeMinutes)?.label || 'N/A',
                    },
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
                    <p>{t('company_details.no_active_tours')}</p>
                  </div>
                )}
              </TabsContent>

              {company.images && company.images.length > 0 && (
                <TabsContent value="photos" className="mt-8">
                  <ImageGallery
                    images={company.images.map((img) => ({
                      id: img.id,
                      url: img.url,
                      alt: img.originalName || 'Company photo',
                    }))}
                    columns={3}
                    aspectRatio="video"
                  />
                </TabsContent>
              )}

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
                <CardTitle className="text-lg">{t('company_details.contact_info.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {company.websiteUrl && (
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-0.5">
                        {t('company_details.contact_info.website')}
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
                        {t('company_details.contact_info.phone')}
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
                        {t('company_details.contact_info.email')}
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

              </CardContent>
            </Card>

            {/* Trust Badges Card */}
            {(company.isVerified || company.avgResponseTimeMinutes) && (
              <Card className="bg-emerald-500/5 border-emerald-500/10">
                <CardContent className="p-6 space-y-4">
                  {company.isVerified && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {t('company_details.verified_partner.title')}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('company_details.verified_partner.desc')}
                        </p>
                      </div>
                    </div>
                  )}
                  {(() => {
                    const rt = formatResponseTime(company.avgResponseTimeMinutes);
                    if (!rt) return null;
                    return (
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center',
                          rt.variant === 'success' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                          rt.variant === 'warning' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                          rt.variant === 'muted' && 'bg-muted text-muted-foreground',
                        )}>
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {t('provider_badges.responds', 'Responds')} {rt.label}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('provider_badges.response_time_desc', 'Average response time to inquiries')}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <RequestInquiryDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        targetType="COMPANY"
        targetId={id}
        entityTitle={company.companyName}
        entitySubtitle={company.description ? company.description.slice(0, 100) + (company.description.length > 100 ? '...' : '') : undefined}
        defaultSubject={`${t('inquiry_dialog.subject_prefix_company', 'Inquiry about')} ${company.companyName}`}
      />
    </div>
  );
}

function CompanyDetailsLoading(): React.ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

export function CompanyDetailsClient(): React.ReactElement {
  return (
    <Suspense fallback={<CompanyDetailsLoading />}>
      <CompanyDetailsContent />
    </Suspense>
  );
}

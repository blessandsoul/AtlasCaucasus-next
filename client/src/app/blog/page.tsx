'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Search, Calendar, Clock, ArrowRight, Tag, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/constants/routes';
import { useBlogs } from '@/features/blog/hooks/useBlogs';
import { BlogCard } from '@/features/blog/components/BlogCard';
import { useDebounce } from '@/hooks/useDebounce';
import { getMediaUrl } from '@/lib/utils/media';
import type { BlogFilters } from '@/features/blog/types/blog.types';

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

function formatTagLabel(tag: string): string {
  return tag
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function BlogPage(): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page') || '1');
  const currentTag = searchParams.get('tag') || undefined;
  const currentSearch = searchParams.get('search') || '';
  const currentSort = (searchParams.get('sortBy') as BlogFilters['sortBy']) || 'newest';

  const [searchInput, setSearchInput] = useState(currentSearch);
  const debouncedSearch = useDebounce(searchInput, 400);

  const filters: BlogFilters = {
    page: currentPage,
    limit: 9,
    search: debouncedSearch || undefined,
    tag: currentTag,
    sortBy: currentSort,
  };

  const { data, isLoading } = useBlogs(filters);
  const posts = data?.items || [];
  const pagination = data?.pagination;

  const featuredPost = currentPage === 1 && !currentSearch && !currentTag ? posts[0] : null;
  const gridPosts = featuredPost ? posts.slice(1) : posts;

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      // Reset to page 1 when filters change
      if (!updates.page) {
        params.delete('page');
      }
      router.push(`${ROUTES.BLOG.LIST}?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      updateParams({ tag: currentTag === tag ? undefined : tag, page: undefined });
    },
    [currentTag, updateParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    router.push(ROUTES.BLOG.LIST);
  }, [router]);

  const hasActiveFilters = !!currentSearch || !!currentTag;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-grid-primary/[0.02] bg-[size:20px_20px]" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
              AtlasCaucasus <span className="text-primary">{t('blog.hero_title', 'Blog')}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {t('blog.hero_subtitle', 'Travel tips, destination guides, and insider stories to help you discover the Caucasus')}
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Search & Filters */}
        <div className="mb-10 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                updateParams({ search: e.target.value || undefined, page: undefined });
              }}
              placeholder={t('blog.search_placeholder', 'Search blog posts...')}
              className="pl-10"
            />
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              {currentTag && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {formatTagLabel(currentTag)}
                  <button onClick={() => handleTagClick(currentTag)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {t('blog.clear_filters', 'Clear all filters')}
              </button>
            </div>
          )}
        </div>

        {/* Featured Post */}
        {featuredPost && !isLoading && (
          <section className="mb-16">
            <Link
              href={ROUTES.BLOG.POST(featuredPost.slug)}
              className="group block"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center rounded-2xl border bg-card p-2 md:p-3 shadow-sm hover:shadow-lg transition-all duration-300">
                {/* Cover image */}
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10">
                  {featuredPost.coverImage?.url ? (
                    <img
                      src={getMediaUrl(featuredPost.coverImage.url)}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                          <Tag className="h-8 w-8 text-primary/60" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          {t('blog.featured', 'Featured Post')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {featuredPost.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {formatTagLabel(tag)}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>

                  {featuredPost.excerpt && (
                    <p className="text-muted-foreground leading-relaxed line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {featuredPost.publishedAt && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(featuredPost.publishedAt)}</span>
                      </div>
                    )}
                    {featuredPost.readingTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{featuredPost.readingTime} {t('blog.min_read', 'min read')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-primary font-medium text-sm pt-2 group-hover:gap-3 transition-all">
                    <span>{t('blog.read_article', 'Read article')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Post Grid */}
        {!isLoading && gridPosts.length > 0 && (
          <section>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {gridPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!isLoading && posts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Tag className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {hasActiveFilters
                ? t('blog.no_results', 'No posts found')
                : t('blog.no_posts', 'No blog posts yet')}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
              {hasActiveFilters
                ? t('blog.no_results_desc', 'Try adjusting your search or filters.')
                : t('blog.no_posts_desc', 'Check back soon for new content!')}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                {t('blog.clear_filters', 'Clear all filters')}
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage}
              onClick={() => updateParams({ page: String(currentPage - 1) })}
            >
              {t('common.previous', 'Previous')}
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground tabular-nums">
              {t('blog.page_of', 'Page {{current}} of {{total}}', {
                current: pagination.page,
                total: pagination.totalPages,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => updateParams({ page: String(currentPage + 1) })}
            >
              {t('common.next', 'Next')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

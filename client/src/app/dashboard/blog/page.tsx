'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, FileText, Eye, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/constants/routes';
import { useMyBlogs } from '@/features/blog/hooks/useBlogs';
import { BlogPostsTable } from '@/features/blog/components/BlogPostsTable';

export default function BlogDashboardPage(): React.ReactElement {
  const { t } = useTranslation();
  const { data, isLoading } = useMyBlogs();

  const posts = data?.items || [];
  const totalPosts = data?.pagination?.totalItems || 0;
  const publishedCount = posts.filter((p) => p.isPublished).length;
  const draftCount = posts.filter((p) => !p.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('dashboard.blog.title', 'Blog Posts')}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.blog.subtitle', 'Create and manage your blog posts')}
          </p>
        </div>
        <Link href={ROUTES.BLOG.CREATE}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('dashboard.blog.create_new', 'Create New Post')}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {isLoading ? <Skeleton className="h-7 w-8" /> : totalPosts}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.blog.total', 'Total')}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Eye className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {isLoading ? <Skeleton className="h-7 w-8" /> : publishedCount}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.blog.published', 'Published')}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <FileEdit className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {isLoading ? <Skeleton className="h-7 w-8" /> : draftCount}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.blog.draft', 'Draft')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-[200px]" />
              <Skeleton className="h-5 w-[80px]" />
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-5 w-[60px]" />
            </div>
          ))}
        </div>
      ) : (
        <BlogPostsTable posts={posts} />
      )}
    </div>
  );
}

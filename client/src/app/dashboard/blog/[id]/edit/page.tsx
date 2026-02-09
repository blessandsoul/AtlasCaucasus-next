'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/constants/routes';
import { useBlog } from '@/features/blog/hooks/useBlogs';
import { BlogPostForm } from '@/features/blog/components/BlogPostForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditBlogPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { t } = useTranslation();
  const router = useRouter();
  const { data: post, isLoading } = useBlog(id);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Link
          href={ROUTES.BLOG.DASHBOARD}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('dashboard.blog.back_to_list', 'Back to Blog Posts')}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('dashboard.blog.edit_title', 'Edit Post')}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.blog.edit_subtitle', 'Update your blog post')}
        </p>
      </div>

      {/* Form or Loading */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : post ? (
        <BlogPostForm
          mode="edit"
          defaultValues={post}
          onSuccess={() => router.push(ROUTES.BLOG.DASHBOARD)}
        />
      ) : (
        <div className="text-center py-12 border rounded-xl bg-card">
          <p className="text-muted-foreground">
            {t('dashboard.blog.not_found', 'Blog post not found.')}
          </p>
        </div>
      )}
    </div>
  );
}

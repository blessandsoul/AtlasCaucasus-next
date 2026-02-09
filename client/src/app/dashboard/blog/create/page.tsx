'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';
import { BlogPostForm } from '@/features/blog/components/BlogPostForm';

export default function CreateBlogPage(): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();

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
          {t('dashboard.blog.create_title', 'Create New Post')}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.blog.create_subtitle', 'Write and publish a new blog post')}
        </p>
      </div>

      {/* Form */}
      <BlogPostForm
        mode="create"
        onSuccess={() => router.push(ROUTES.BLOG.DASHBOARD)}
      />
    </div>
  );
}

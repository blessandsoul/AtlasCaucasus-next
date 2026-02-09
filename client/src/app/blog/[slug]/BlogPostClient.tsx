'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, ArrowLeft, ArrowRight, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareButton } from '@/components/common/ShareButton';
import { ROUTES } from '@/lib/constants/routes';
import { getMediaUrl } from '@/lib/utils/media';
import { useBlog, useRelatedBlogs } from '@/features/blog/hooks/useBlogs';
import { BlogCard } from '@/features/blog/components/BlogCard';

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

interface BlogPostClientProps {
  slug: string;
}

/**
 * BlogPostClient renders blog content authored exclusively by ADMIN users.
 *
 * SAFETY NOTE on dangerouslySetInnerHTML usage:
 * - Blog posts can ONLY be created/edited by users with the ADMIN role
 *   (enforced by requireRole("ADMIN") middleware on all write endpoints).
 * - This is equivalent to CMS-authored content — admins are trusted content authors.
 * - The server blog.repo.ts stores admin-authored HTML in the `content` column.
 * - No untrusted user-generated content ever reaches this render path.
 *
 * If the content model changes to allow non-admin authors in the future,
 * DOMPurify sanitization MUST be added before rendering.
 */
export function BlogPostClient({ slug }: BlogPostClientProps): React.ReactElement {
  const { t } = useTranslation();
  const { data: post, isLoading } = useBlog(slug);
  const { data: relatedPosts } = useRelatedBlogs(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 pt-24 md:pt-32 pb-12">
            <div className="max-w-3xl mx-auto space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        </section>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-4 py-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  const postUrl = `/blog/${slug}`;
  const authorName = post.author
    ? `${post.author.firstName} ${post.author.lastName}`
    : undefined;

  return (
    <div className="min-h-screen">
      {/* Header area */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-grid-primary/[0.02] bg-[size:20px_20px]" />
        <div className="container mx-auto px-4 pt-24 md:pt-32 pb-12 relative">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link
              href={ROUTES.BLOG.LIST}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('blog.back', 'Back to Blog')}</span>
            </Link>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {formatTagLabel(tag)}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-balance mb-6">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {authorName && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{authorName}</span>
                </div>
              )}
              {post.publishedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
              )}
              {post.readingTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{post.readingTime} {t('blog.min_read', 'min read')}</span>
                </div>
              )}
              <ShareButton url={postUrl} title={post.title} description={post.excerpt || undefined} />
            </div>
          </div>
        </div>
      </section>

      {/* Cover image */}
      <div className="container mx-auto px-4 -mt-2 mb-10">
        <div className="max-w-3xl mx-auto">
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 shadow-sm">
            {post.coverImage?.url ? (
              <img
                src={getMediaUrl(post.coverImage.url)}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Tag className="h-7 w-7 text-primary/50" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Article Content — admin-authored HTML (see safety note in JSDoc above) */}
      <article className="container mx-auto px-4 pb-16">
        <div
          className="max-w-3xl mx-auto prose prose-lg prose-slate dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-em:text-foreground/80"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-8 md:p-10 text-center space-y-4">
            <h2 className="text-2xl font-bold">
              {t('blog.cta_title', 'Ready to Explore the Caucasus?')}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t('blog.cta_desc', 'Browse verified tours, connect with local guides, and start planning your unforgettable Caucasus adventure.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href={ROUTES.EXPLORE.TOURS}>
                <Button size="lg" className="gap-2">
                  {t('blog.browse_tours', 'Browse Tours')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={ROUTES.EXPLORE.GUIDES}>
                <Button size="lg" variant="outline" className="gap-2">
                  {t('blog.find_guide', 'Find a Guide')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="container mx-auto px-4 pb-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">
              {t('blog.related_posts', 'You might also enjoy')}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <BlogCard key={related.id} post={related} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

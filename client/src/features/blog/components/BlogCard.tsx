'use client';

import Link from 'next/link';
import { Calendar, Clock, Tag } from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';
import { getMediaUrl } from '@/lib/utils/media';
import type { BlogPost } from '../types/blog.types';

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

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard = ({ post }: BlogCardProps): React.ReactElement => {
  return (
    <Link
      href={ROUTES.BLOG.POST(post.slug)}
      className="group flex flex-col rounded-xl border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      {/* Cover */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 overflow-hidden">
        {post.coverImage?.url ? (
          <img
            src={getMediaUrl(post.coverImage.url)}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Tag className="h-6 w-6 text-primary/50" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
            >
              {formatTagLabel(tag)}
            </span>
          ))}
        </div>

        <h3 className="text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
          {post.publishedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
          )}
          {post.readingTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{post.readingTime} min</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

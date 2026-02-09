'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/constants/routes';
import { useDeleteBlog } from '../hooks/useBlogs';
import type { BlogPost } from '../types/blog.types';

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

interface BlogPostsTableProps {
  posts: BlogPost[];
}

export const BlogPostsTable = ({ posts }: BlogPostsTableProps): React.ReactElement => {
  const { t } = useTranslation();
  const deleteBlog = useDeleteBlog();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (): void => {
    if (deleteId) {
      deleteBlog.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 border rounded-xl bg-card">
        <p className="text-muted-foreground">
          {t('dashboard.blog.no_posts', 'No blog posts yet. Create your first post!')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('dashboard.blog.table.title', 'Title')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('dashboard.blog.table.status', 'Status')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  {t('dashboard.blog.table.tags', 'Tags')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  {t('dashboard.blog.table.views', 'Views')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  {t('dashboard.blog.table.date', 'Date')}
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('dashboard.blog.table.actions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="max-w-[250px]">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      {post.excerpt && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{post.excerpt}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {post.isPublished ? (
                      <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/10">
                        {t('dashboard.blog.published', 'Published')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t('dashboard.blog.draft', 'Draft')}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{post.tags.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm tabular-nums text-muted-foreground">{post.viewCount}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {post.isPublished && (
                          <DropdownMenuItem asChild>
                            <Link href={ROUTES.BLOG.POST(post.slug)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t('dashboard.blog.view', 'View')}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={ROUTES.BLOG.EDIT(post.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('dashboard.blog.edit', 'Edit')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(post.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('dashboard.blog.delete', 'Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('dashboard.blog.delete_confirm_title', 'Delete Blog Post')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.blog.delete_confirm_desc', 'This will unpublish the blog post. This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('dashboard.blog.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

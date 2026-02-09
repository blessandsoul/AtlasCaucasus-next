'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Upload, Trash2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { getMediaUrl } from '@/lib/utils/media';
import { useCreateBlog, useUpdateBlog, useUploadBlogCover, useDeleteBlogCover } from '../hooks/useBlogs';
import type { BlogPost } from '../types/blog.types';

const blogFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title must be at most 255 characters'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt must be at most 500 characters').optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
});

type BlogFormData = z.infer<typeof blogFormSchema>;

interface BlogPostFormProps {
  mode: 'create' | 'edit';
  defaultValues?: BlogPost;
  onSuccess?: (post: BlogPost) => void;
}

export const BlogPostForm = ({ mode, defaultValues, onSuccess }: BlogPostFormProps): React.ReactElement => {
  const { t } = useTranslation();
  const [tags, setTags] = useState<string[]>(defaultValues?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [pendingCoverPreview, setPendingCoverPreview] = useState<string | null>(null);

  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog();
  const uploadCover = useUploadBlogCover();
  const deleteCover = useDeleteBlogCover();

  const isSubmitting = createBlog.isPending || updateBlog.isPending;

  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      content: defaultValues?.content || '',
      excerpt: defaultValues?.excerpt || '',
      isPublished: defaultValues?.isPublished || false,
    },
  });

  const handleAddTag = (): void => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string): void => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mode === 'edit' && defaultValues?.id) {
      uploadCover.mutate({ id: defaultValues.id, file });
    } else {
      // In create mode, store file for upload after post creation
      setPendingCoverFile(file);
      setPendingCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePendingCover = (): void => {
    setPendingCoverFile(null);
    if (pendingCoverPreview) {
      URL.revokeObjectURL(pendingCoverPreview);
      setPendingCoverPreview(null);
    }
  };

  const onSubmit = async (data: BlogFormData): Promise<void> => {
    const payload = {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || undefined,
      tags: tags.length > 0 ? tags : undefined,
      isPublished: data.isPublished,
    };

    if (mode === 'create') {
      createBlog.mutate(payload, {
        onSuccess: (post) => {
          if (pendingCoverFile && post.id) {
            uploadCover.mutate(
              { id: post.id, file: pendingCoverFile },
              { onSettled: () => onSuccess?.(post) }
            );
          } else {
            onSuccess?.(post);
          }
        },
      });
    } else if (defaultValues?.id) {
      updateBlog.mutate(
        { id: defaultValues.id, data: payload },
        {
          onSuccess: (post) => {
            onSuccess?.(post);
          },
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold">
            {t('dashboard.blog.basic_info', 'Basic Information')}
          </h3>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('dashboard.blog.title_label', 'Title')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('dashboard.blog.title_placeholder', 'Enter blog post title...')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('dashboard.blog.excerpt_label', 'Excerpt')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('dashboard.blog.excerpt_placeholder', 'Brief summary (max 500 characters)...')}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Content */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold">
            {t('dashboard.blog.content_label', 'Content')}
          </h3>

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder={t('dashboard.blog.content_placeholder', 'Write your blog post content (HTML supported)...')}
                    rows={15}
                    className="font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tags */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold">
            {t('dashboard.blog.tags_label', 'Tags')}
          </h3>

          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={t('dashboard.blog.tags_placeholder', 'Add a tag and press Enter...')}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={handleAddTag} disabled={tags.length >= 10}>
              {t('dashboard.blog.add_tag', 'Add')}
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {t('dashboard.blog.tags_hint', 'Maximum 10 tags. Press Enter to add.')}
          </p>
        </div>

        {/* Cover Image */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold">
            {t('dashboard.blog.cover_image', 'Cover Image')}
          </h3>

          {/* Edit mode: show existing cover */}
          {mode === 'edit' && defaultValues?.coverImage?.url ? (
            <div className="relative group">
              <div className="aspect-[21/9] rounded-lg overflow-hidden bg-muted">
                <img
                  src={getMediaUrl(defaultValues.coverImage.url)}
                  alt={defaultValues.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteCover.mutate(defaultValues.id)}
                disabled={deleteCover.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('dashboard.blog.remove_cover', 'Remove')}
              </Button>
            </div>
          ) : pendingCoverPreview ? (
            /* Create mode: show pending cover preview */
            <div className="relative group">
              <div className="aspect-[21/9] rounded-lg overflow-hidden bg-muted">
                <img
                  src={pendingCoverPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemovePendingCover}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('dashboard.blog.remove_cover', 'Remove')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center aspect-[21/9] rounded-lg border-2 border-dashed bg-muted/50">
              <div className="text-center space-y-2">
                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.blog.no_cover', 'No cover image')}
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="cover-upload" className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" asChild disabled={uploadCover.isPending}>
                <span>
                  {uploadCover.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  {t('dashboard.blog.upload_cover', 'Upload Cover')}
                </span>
              </Button>
            </Label>
            <input
              id="cover-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </div>
        </div>

        {/* Publishing */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold">
            {t('dashboard.blog.publishing', 'Publishing')}
          </h3>

          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t('dashboard.blog.publish_label', 'Publish')}
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.blog.publish_hint', 'Make this post visible to the public')}
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === 'create'
              ? t('dashboard.blog.create_btn', 'Create Post')
              : t('dashboard.blog.update_btn', 'Save Changes')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

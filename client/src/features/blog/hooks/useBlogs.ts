'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { blogService } from '../services/blog.service';
import { getErrorMessage } from '@/lib/utils/error';
import type {
  BlogFilters,
  MyBlogsParams,
  BlogsResponse,
  CreateBlogInput,
  UpdateBlogInput,
} from '../types/blog.types';

export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (filters: BlogFilters) => [...blogKeys.lists(), filters] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (idOrSlug: string) => [...blogKeys.details(), idOrSlug] as const,
  my: () => [...blogKeys.all, 'my'] as const,
  myList: (params: MyBlogsParams) => [...blogKeys.my(), params] as const,
  related: (idOrSlug: string) => [...blogKeys.all, 'related', idOrSlug] as const,
};

export const useBlogs = (params: BlogFilters = {}) => {
  return useQuery({
    queryKey: blogKeys.list(params),
    queryFn: () => blogService.getBlogs(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useBlog = (idOrSlug: string) => {
  return useQuery({
    queryKey: blogKeys.detail(idOrSlug),
    queryFn: () => blogService.getBlog(idOrSlug),
    enabled: !!idOrSlug,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRelatedBlogs = (idOrSlug: string) => {
  return useQuery({
    queryKey: blogKeys.related(idOrSlug),
    queryFn: () => blogService.getRelatedBlogs(idOrSlug),
    enabled: !!idOrSlug,
    staleTime: 10 * 60 * 1000,
  });
};

export const useMyBlogs = (params: MyBlogsParams = {}) => {
  return useQuery<BlogsResponse>({
    queryKey: blogKeys.myList(params),
    queryFn: () => blogService.getMyBlogs(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useCreateBlog = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateBlogInput) => blogService.createBlog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.my() });
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      toast.success(t('dashboard.blog.create_success', 'Blog post created successfully!'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateBlog = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBlogInput }) =>
      blogService.updateBlog(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.my() });
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      toast.success(t('dashboard.blog.update_success', 'Blog post updated successfully!'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteBlog = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => blogService.deleteBlog(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.my() });
      queryClient.removeQueries({ queryKey: blogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      toast.success(t('dashboard.blog.delete_success', 'Blog post deleted successfully!'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUploadBlogCover = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      blogService.uploadBlogCover(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: blogKeys.my() });
      toast.success(t('dashboard.blog.cover_upload_success', 'Cover image uploaded successfully!'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteBlogCover = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => blogService.deleteBlogCover(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: blogKeys.my() });
      toast.success(t('dashboard.blog.cover_delete_success', 'Cover image deleted successfully!'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

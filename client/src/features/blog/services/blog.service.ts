import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
  BlogPost,
  BlogsResponse,
  BlogFilters,
  MyBlogsParams,
  CreateBlogInput,
  UpdateBlogInput,
  BlogImage,
} from '../types/blog.types';

class BlogService {
  async getBlogs(params: BlogFilters = {}): Promise<BlogsResponse> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: BlogsResponse;
    }>(API_ENDPOINTS.BLOGS.LIST, { params });

    return response.data.data;
  }

  async getBlog(idOrSlug: string): Promise<BlogPost> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: BlogPost;
    }>(API_ENDPOINTS.BLOGS.GET(idOrSlug));

    return response.data.data;
  }

  async getRelatedBlogs(idOrSlug: string): Promise<BlogPost[]> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: BlogPost[];
    }>(API_ENDPOINTS.BLOGS.RELATED(idOrSlug));

    return response.data.data;
  }

  async getMyBlogs(params: MyBlogsParams = {}): Promise<BlogsResponse> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: BlogsResponse;
    }>(API_ENDPOINTS.BLOGS.MY_BLOGS, { params });

    return response.data.data;
  }

  async createBlog(data: CreateBlogInput): Promise<BlogPost> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: BlogPost;
    }>(API_ENDPOINTS.BLOGS.CREATE, data);

    return response.data.data;
  }

  async updateBlog(id: string, data: UpdateBlogInput): Promise<BlogPost> {
    const response = await apiClient.patch<{
      success: boolean;
      message: string;
      data: BlogPost;
    }>(API_ENDPOINTS.BLOGS.UPDATE(id), data);

    return response.data.data;
  }

  async deleteBlog(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.BLOGS.DELETE(id));
  }

  async uploadBlogCover(id: string, file: File): Promise<BlogImage> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: BlogImage;
    }>(API_ENDPOINTS.BLOGS.UPLOAD_COVER(id), formData);

    return response.data.data;
  }

  async deleteBlogCover(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.BLOGS.DELETE_COVER(id));
  }
}

export const blogService = new BlogService();

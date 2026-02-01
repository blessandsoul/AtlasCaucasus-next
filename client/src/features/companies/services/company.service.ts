import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
  Company,
  CompaniesResponse,
  CompanyFilters,
  CompanyMedia,
  IGetTourAgentsResponse,
  IUpdateCompanyRequest,
  IGetMyCompanyResponse,
  CreateAgentFormData,
  CreateTourAgentResponse,
} from '../types/company.types';

class CompanyService {
  async getCompanies(params: CompanyFilters = {}): Promise<CompaniesResponse> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: CompaniesResponse;
    }>(API_ENDPOINTS.COMPANIES.LIST, { params });

    return response.data.data;
  }

  async getCompany(id: string): Promise<Company> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: Company;
    }>(API_ENDPOINTS.COMPANIES.GET(id));

    return response.data.data;
  }

  async getMyCompany(): Promise<IGetMyCompanyResponse> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: IGetMyCompanyResponse;
    }>(API_ENDPOINTS.COMPANIES.MY_COMPANY);

    return response.data.data;
  }

  async updateCompany(id: string, data: IUpdateCompanyRequest): Promise<Company> {
    const response = await apiClient.patch<{
      success: boolean;
      message: string;
      data: Company;
    }>(API_ENDPOINTS.COMPANIES.UPDATE(id), data);

    return response.data.data;
  }

  async deleteCompany(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.COMPANIES.DELETE(id));
  }

  async getTourAgents(): Promise<IGetTourAgentsResponse> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: IGetTourAgentsResponse;
    }>(API_ENDPOINTS.AUTH.TOUR_AGENTS);

    return response.data.data;
  }

  async createTourAgent(data: CreateAgentFormData): Promise<CreateTourAgentResponse> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: CreateTourAgentResponse;
    }>(API_ENDPOINTS.AUTH.CREATE_TOUR_AGENT, data);

    return response.data.data;
  }

  // Photo management
  async getPhotos(id: string): Promise<CompanyMedia[]> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: CompanyMedia[];
    }>(API_ENDPOINTS.COMPANIES.PHOTOS(id));

    return response.data.data;
  }

  async uploadPhotos(id: string, files: File | File[]): Promise<CompanyMedia[]> {
    const formData = new FormData();
    const fileList = Array.isArray(files) ? files : [files];

    fileList.forEach((file) => {
      formData.append('file', file);
    });

    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: CompanyMedia[];
    }>(API_ENDPOINTS.COMPANIES.PHOTOS(id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  async deletePhoto(id: string, photoId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.COMPANIES.DELETE_PHOTO(id, photoId));
  }

  // Logo management
  async uploadLogo(companyId: string, file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { logoUrl: string };
    }>(API_ENDPOINTS.COMPANIES.UPLOAD_LOGO(companyId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }
}

export const companyService = new CompanyService();

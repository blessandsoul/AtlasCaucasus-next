import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
  Inquiry,
  InquiriesResponse,
  ReceivedInquiriesResponse,
  CreateInquiryInput,
  RespondToInquiryInput,
  InquiryFilters,
} from '../types/inquiry.types';

class InquiryService {
  async getSentInquiries(params: InquiryFilters = {}) {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: InquiriesResponse;
    }>(API_ENDPOINTS.INQUIRIES.LIST, { params });

    return response.data.data;
  }

  async getReceivedInquiries(params: InquiryFilters = {}) {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: ReceivedInquiriesResponse;
    }>(API_ENDPOINTS.INQUIRIES.RECEIVED, { params });

    return response.data.data;
  }

  async getInquiry(id: string) {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: Inquiry;
    }>(API_ENDPOINTS.INQUIRIES.GET(id));

    return response.data.data;
  }

  async createInquiry(data: CreateInquiryInput) {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: Inquiry;
    }>(API_ENDPOINTS.INQUIRIES.CREATE, data);

    return response.data;
  }

  async respondToInquiry(id: string, data: RespondToInquiryInput) {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: Inquiry;
    }>(API_ENDPOINTS.INQUIRIES.RESPOND(id), data);

    return response.data;
  }
}

export const inquiryService = new InquiryService();

// Inquiry types matching backend API response

export type InquiryTargetType = 'TOUR' | 'GUIDE' | 'DRIVER' | 'COMPANY';
export type InquiryStatus = 'PENDING' | 'RESPONDED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface InquiryUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface InquiryResponseDetail {
  id: string;
  recipientId: string;
  recipient: InquiryUser;
  status: InquiryStatus;
  message: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Inquiry {
  id: string;
  userId: string;
  user: InquiryUser;
  targetType: InquiryTargetType;
  targetIds: string[];
  subject: string;
  message: string;
  requiresPayment: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  responses: InquiryResponseDetail[];
}

export interface ReceivedInquiry {
  id: string;
  inquiryId: string;
  inquiry: Inquiry;
  status: InquiryStatus;
  message: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InquiriesResponse {
  items: Inquiry[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ReceivedInquiriesResponse {
  items: ReceivedInquiry[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CreateInquiryInput {
  targetType: InquiryTargetType;
  targetIds: string[];
  subject: string;
  message: string;
}

export interface RespondToInquiryInput {
  status: 'RESPONDED' | 'ACCEPTED' | 'DECLINED';
  message?: string;
}

export interface InquiryFilters {
  page?: number;
  limit?: number;
  status?: InquiryStatus;
  targetType?: InquiryTargetType;
}

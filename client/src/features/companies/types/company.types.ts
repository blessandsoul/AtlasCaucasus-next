export interface CompanyMedia {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  entityType: string;
  entityId: string;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  userId: string;
  companyName: string;
  description: string | null;
  registrationNumber: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  phoneNumber: string | null;
  isVerified: boolean;
  averageRating: number | null;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
  };
  images?: CompanyMedia[];
}

export interface IUpdateCompanyRequest {
  companyName?: string;
  description?: string;
  registrationNumber?: string;
  logoUrl?: string;
  websiteUrl?: string;
  phoneNumber?: string;
}

export interface IGetMyCompanyResponse {
  company: Company;
}

export interface CreateAgentFormData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface CreateTourAgentResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
  temporaryPassword: string;
}

export interface CompanyFilters {
  isVerified?: boolean;
  search?: string;
  locationId?: string;
  hasActiveTours?: boolean;
  minRating?: number;
  sortBy?: 'newest' | 'rating' | 'name';
  page?: number;
  limit?: number;
}

export interface CompaniesResponse {
  items: Company[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface TourAgent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface IGetTourAgentsResponse {
  tourAgents: TourAgent[];
}

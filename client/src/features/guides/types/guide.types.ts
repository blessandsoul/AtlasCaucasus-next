// Guide types matching server response

export interface GuideLocation {
  locationId: string;
  isPrimary: boolean;
  location?: {
    id: string;
    name: string;
    region: string | null;
    country: string;
  };
}

export interface Location {
  id: string;
  name: string;
  region: string | null;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
}

export interface GuideMedia {
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

export interface Guide {
  id: string;
  userId: string;
  bio: string | null;
  languages: string[];
  yearsOfExperience: number | null;
  photoUrl: string | null;
  phoneNumber: string | null;
  isVerified: boolean;
  isAvailable: boolean;
  averageRating: string | null;
  reviewCount: number;
  avgResponseTimeMinutes: number | null;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    emailVerified?: boolean;
  };
  locations?: GuideLocation[] | Location[];
  pricePerDay?: number | string;
  currency?: string;
  photos?: GuideMedia[];
  avatarUrl: string | null; // Primary profile photo
  coverUrl: string | null; // Cover/hero image
}

export interface UpdateGuideInput {
  bio?: string;
  languages?: string[];
  yearsOfExperience?: number;
  phoneNumber?: string;
  pricePerDay?: number;
  currency?: string;
  isAvailable?: boolean;
  locationIds?: string[];
}

export interface GuideFilters {
  locationId?: string;
  language?: string;
  isVerified?: boolean;
  isAvailable?: boolean;
  minExperience?: number;
  search?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'rating' | 'experience' | 'price' | 'price_desc';
  page?: number;
  limit?: number;
}

export interface GuidePaginatedResponse {
  items: Guide[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

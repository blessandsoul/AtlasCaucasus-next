import type { SafeMedia } from "../media/media.types.js";

export type TourDifficulty = 'easy' | 'moderate' | 'challenging';

export interface Tour {
  id: string;
  ownerId: string;
  companyId: string | null;
  title: string;
  summary: string | null;
  description: string | null;
  price: string;
  currency: string;
  city: string | null;
  startLocation: string | null;
  originalPrice: string | null;
  durationMinutes: number | null;
  maxPeople: number | null;
  difficulty: TourDifficulty | null;
  category: string | null;
  isActive: boolean;
  isInstantBooking: boolean;
  hasFreeCancellation: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  nextAvailableDate: Date | null;
  startDate: Date | null;
}

export interface CreateTourData {
  title: string;
  price: string | number;
  companyId?: string | null;
  summary?: string | null;
  description?: string | null;
  currency?: string;
  city?: string | null;
  startLocation?: string | null;
  originalPrice?: string | number | null;
  durationMinutes?: number | null;
  maxPeople?: number | null;
  difficulty?: TourDifficulty | null;
  category?: string | null;
  isActive?: boolean;
  isInstantBooking?: boolean;
  hasFreeCancellation?: boolean;
  isFeatured?: boolean;
  nextAvailableDate?: Date | null;
  startDate?: Date | null;
}

export interface UpdateTourData {
  title?: string;
  summary?: string | null;
  description?: string | null;
  price?: string | number;
  currency?: string;
  city?: string | null;
  startLocation?: string | null;
  originalPrice?: string | number | null;
  durationMinutes?: number | null;
  maxPeople?: number | null;
  difficulty?: TourDifficulty | null;
  category?: string | null;
  isActive?: boolean;
  isInstantBooking?: boolean;
  hasFreeCancellation?: boolean;
  isFeatured?: boolean;
  nextAvailableDate?: Date | null;
  startDate?: Date | null;
}

export interface SafeTour {
  id: string;
  ownerId: string;
  companyId: string | null;
  title: string;
  summary: string | null;
  description: string | null;
  price: string;
  currency: string;
  city: string | null;
  startLocation: string | null;
  originalPrice: string | null;
  durationMinutes: number | null;
  maxPeople: number | null;
  difficulty: string | null;
  category: string | null;
  isActive: boolean;
  isInstantBooking: boolean;
  hasFreeCancellation: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  nextAvailableDate: Date | null;
  startDate: Date | null;
  images?: SafeMedia[]; // Media images associated with tour
}

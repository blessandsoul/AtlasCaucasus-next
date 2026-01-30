// User type (matches backend SafeUser model)
export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[]; // Array of roles
  isActive: boolean;
  emailVerified: boolean;

  // Profiles
  companyProfile?: any | null; // Using any for now to avoid copying all interfaces if not needed yet, or better to copy them.
  guideProfile?: any | null; // Let's keep it simple for Login task, but structure should match.
  driverProfile?: any | null;

  driverProfileId?: string;
  guideProfileId?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'USER' | 'COMPANY' | 'ADMIN' | 'GUIDE' | 'DRIVER' | 'TOUR_AGENT';

// Auth tokens
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Request types
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ICompanyRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  registrationNumber?: string;
  description?: string;
  websiteUrl?: string;
  phoneNumber?: string;
}

export interface IAuthState {
  user: IUser | null;
  tokens: IAuthTokens | null;
  isAuthenticated: boolean;
}

// Guide profile for claim role
export interface IGuideProfile {
  bio?: string;
  languages: string[];
  yearsOfExperience?: number;
  phoneNumber?: string;
}

// Driver profile for claim role
export interface IDriverProfile {
  bio?: string;
  vehicleType?: string;
  vehicleCapacity?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  licenseNumber?: string;
  phoneNumber?: string;
}

// Claim GUIDE role request
export interface IClaimGuideRoleRequest {
  role: 'GUIDE';
  profile: IGuideProfile;
}

// Claim DRIVER role request
export interface IClaimDriverRoleRequest {
  role: 'DRIVER';
  profile: IDriverProfile;
}

// Union type for claim role request
export type IClaimRoleRequest = IClaimGuideRoleRequest | IClaimDriverRoleRequest;

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

export interface IAuthState {
  user: IUser | null;
  tokens: IAuthTokens | null;
  isAuthenticated: boolean;
}

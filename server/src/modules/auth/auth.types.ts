import type { SafeUser, UserRole } from "../users/user.types.js";

export interface AccessTokenPayload {
  userId: string;
  roles: UserRole[];
  tokenVersion: number;
  emailVerified: boolean;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenVersion: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

// JWT decoded user (used in auth middleware)
export interface JwtUser {
  id: string;
  roles: UserRole[];
  emailVerified: boolean;
}

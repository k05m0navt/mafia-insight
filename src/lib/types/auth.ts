import { UserRole } from '@/types/navigation';

/**
 * Authentication error codes from Supabase
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'invalid_credentials',
  EMAIL_NOT_CONFIRMED = 'email_not_confirmed',
  TOO_MANY_REQUESTS = 'too_many_requests',
  WEAK_PASSWORD = 'weak_password',
  EMAIL_ALREADY_EXISTS = 'email_already_exists',
  TOKEN_EXPIRED = 'token_expired',
  SESSION_EXPIRED = 'session_expired',
  NETWORK_ERROR = 'network_error',
  INTERNAL_ERROR = 'internal_error',
  USER_NOT_FOUND = 'user_not_found',
  EMAIL_NOT_VERIFIED = 'email_not_verified',
  INVALID_TOKEN = 'invalid_token',
}

/**
 * Authentication action types
 */
export enum AuthAction {
  LOGIN = 'login',
  SIGNUP = 'signup',
  PASSWORD_RESET = 'password_reset',
  TOKEN_REFRESH = 'token_refresh',
  LOGOUT = 'logout',
  EMAIL_CONFIRMATION = 'email_confirmation',
}

/**
 * Authentication error interface
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  userMessage: string;
  action: AuthAction;
  context?: Record<string, unknown>;
}

/**
 * Authentication session interface
 */
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Authenticated user interface
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Signup credentials interface
 */
export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  confirmPassword?: string;
}

/**
 * Password reset request interface
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation interface
 */
export interface PasswordResetConfirmation {
  token: string;
  password: string;
}

/**
 * Token refresh request interface
 */
export interface TokenRefreshRequest {
  refreshToken: string;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  error: AuthError | null;
}

/**
 * Authentication context value interface
 */
export interface AuthContextValue {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  resetPassword: (request: PasswordResetRequest) => Promise<void>;
  confirmPasswordReset: (
    confirmation: PasswordResetConfirmation
  ) => Promise<void>;
}

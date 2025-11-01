import {
  User,
  LoginCredentials,
  SignupCredentials,
  AuthResponse,
  UserRole,
} from '@/types/auth';
import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { Session, User as NextAuthUser } from 'next-auth';
import { AdapterUser } from 'next-auth/adapters';
import { AuthenticationError } from './errors';

// Extend NextAuth types to include role
declare module 'next-auth' {
  interface User {
    role?: UserRole;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: UserRole;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    email?: string;
    role?: UserRole;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/auth';

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AuthenticationError(
        errorData.message || 'Authentication failed'
      );
    }

    return response.json();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      this.token = response.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
      }

      return response;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Login failed');
    }
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>('/signup', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      this.token = response.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
      }

      return response;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Signup failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.makeRequest<User>('/me');
  }

  async getPermissions(): Promise<string[]> {
    const response = await this.makeRequest<{ permissions: string[] }>(
      '/permissions'
    );
    return response.permissions;
  }

  async refreshToken(): Promise<{
    success: boolean;
    token?: string;
    expiresAt?: Date;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        token?: string;
        expiresAt?: string;
        message?: string;
      }>('/refresh', {
        method: 'POST',
      });

      if (response.success && response.token) {
        this.token = response.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', response.token);
        }

        return {
          success: true,
          token: response.token,
          expiresAt: response.expiresAt
            ? new Date(response.expiresAt)
            : undefined,
        };
      }

      return {
        success: false,
        error: 'Token refresh failed',
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: 'Token refresh failed',
      };
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const authService = AuthService.getInstance();

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    // Add your authentication providers here
    // For now, we'll use a simple credentials provider
  ],
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user: NextAuthUser | AdapterUser;
    }) {
      if (user) {
        token.id = user.id;
        token.email = user.email || undefined;
        token.role = user.role || 'user';
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email || '';
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateSignupCredentials = (
  credentials: SignupCredentials
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!credentials.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(credentials.email)) {
    errors.email = 'Invalid email format';
  }

  if (!credentials.password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(credentials.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }
  }

  if (!credentials.confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (credentials.password !== credentials.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateLoginCredentials = (
  credentials: LoginCredentials
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!credentials.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(credentials.email)) {
    errors.email = 'Invalid email format';
  }

  if (!credentials.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

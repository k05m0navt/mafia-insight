export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  permissions: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'user' | 'guest' | 'moderator';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthError {
  message: string;
  code: string;
  field?: string;
}

export interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

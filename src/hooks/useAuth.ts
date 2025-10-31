import { useState, useEffect, useCallback } from 'react';
import {
  authService,
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from '@/services/AuthService';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;
  updateProfile: (profileData: Partial<User>) => Promise<AuthResponse>;
  clearError: () => void;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state and check cookies on every mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        // Force AuthService to check cookies
        const user = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();

        console.log('[useAuth] Initializing auth state:', {
          isAuthenticated,
          userRole: user?.role,
        });

        setState({
          user,
          isAuthenticated,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('[useAuth] Auth initialization error:', error);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Authentication initialization failed',
        });
      }
    };

    // Run on mount and also listen for storage events (cookies)
    initializeAuth();

    // Listen for custom auth events
    const handleAuthChange = () => {
      console.log('[useAuth] Auth change event received, re-initializing');
      initializeAuth();
    };

    // Listen for page visibility changes (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[useAuth] Page visible, checking auth state');
        initializeAuth();
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Login function
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResponse> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await authService.login(credentials);

        if (response.success) {
          setState({
            user: response.user || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: response.error || 'Login failed',
          }));
        }

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Login failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  // Register function
  const register = useCallback(
    async (userData: RegisterData): Promise<AuthResponse> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await authService.register(userData);

        if (response.success) {
          setState({
            user: response.user || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: response.error || 'Registration failed',
          }));
        }

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Registration failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  // Logout function
  const logout = useCallback(() => {
    authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  // Reset password function
  const resetPassword = useCallback(
    async (email: string): Promise<{ success: boolean; message: string }> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await authService.resetPassword(email);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: response.success
            ? null
            : response.message || 'Password reset failed',
        }));

        return {
          success: response.success,
          message:
            response.message ||
            (response.success
              ? 'Password reset email sent'
              : 'Password reset failed'),
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Password reset failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        return {
          success: false,
          message: errorMessage,
        };
      }
    },
    []
  );

  // Update profile function
  const updateProfile = useCallback(
    async (profileData: Partial<User>): Promise<AuthResponse> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await authService.updateProfile(profileData);

        if (response.success) {
          setState((prev) => ({
            ...prev,
            user: response.user || prev.user,
            isLoading: false,
            error: null,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: response.error || 'Profile update failed',
          }));
        }

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Profile update failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  // Clear error function
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    clearError,
  };
}

export default useAuth;

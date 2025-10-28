'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import {
  User,
  AuthState,
  LoginCredentials,
  SignupCredentials,
  AuthContextType,
} from '@/types/auth';
import { authService } from '@/lib/auth';
import { AuthenticationError } from '@/lib/errors';
import { permissionService } from '@/lib/permissions';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const checkAuthStatus = async () => {
      if (authService.isAuthenticated()) {
        try {
          dispatch({ type: 'AUTH_START' });
          const user = await authService.getCurrentUser();
          const permissions = await authService.getPermissions();

          // Set permissions in permission service
          permissionService.setPermissions(permissions);

          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token: authService.getToken() || '' },
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authService.login(credentials);
      const permissions = await authService.getPermissions();

      // Set permissions in permission service
      permissionService.setPermissions(permissions);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.token },
      });
    } catch (error) {
      const errorMessage =
        error instanceof AuthenticationError ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authService.signup(credentials);
      const permissions = await authService.getPermissions();

      // Set permissions in permission service
      permissionService.setPermissions(permissions);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.token },
      });
    } catch (error) {
      const errorMessage =
        error instanceof AuthenticationError ? error.message : 'Signup failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      await authService.logout();
      permissionService.setPermissions([]);

      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
      // Still dispatch logout even if API call fails
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    authState: state,
    login,
    signup,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking authentication status
export function useAuthStatus() {
  const { authState } = useAuth();
  return {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    user: authState.user,
  };
}

// Hook for getting current user
export function useCurrentUser(): User | null {
  const { authState } = useAuth();
  return authState.user;
}

// Hook for checking if user has specific role
export function useUserRole(): string | null {
  const { authState } = useAuth();
  return authState.user?.role || null;
}

// Hook for checking if user is admin
export function useIsAdmin(): boolean {
  const { authState } = useAuth();
  return authState.user?.role === 'admin';
}

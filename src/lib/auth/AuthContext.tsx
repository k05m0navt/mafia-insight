'use client';

import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { AuthContextType, User as AuthContextUser } from '@/types/auth';
import type { User as AuthServiceUser } from '@/services/AuthService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  // Map AuthService.User to types/auth.User
  const mapUser = (user: AuthServiceUser | null): AuthContextUser | null => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role:
        user.role === 'admin' || user.role === 'moderator' ? user.role : 'user',
      permissions: [], // Default empty permissions array
      lastLoginAt: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  };

  const contextValue: AuthContextType = {
    authState: {
      isAuthenticated: auth.isAuthenticated,
      user: mapUser(auth.user),
      isLoading: auth.isLoading,
      error: auth.error,
    },
    login: async (credentials) => {
      await auth.login(credentials);
    },
    signup: async (credentials) => {
      const registerData = {
        email: credentials.email,
        password: credentials.password,
        name: credentials.email.split('@')[0], // Use email prefix as name
      };
      await auth.register(registerData);
    },
    logout: async () => {
      auth.logout();
    },
    clearError: auth.clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Export the context for advanced usage
export { AuthContext };

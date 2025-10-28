'use client';

import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  const contextValue: AuthContextType = {
    authState: auth.authState,
    login: auth.login,
    signup: auth.signup,
    logout: auth.logout,
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

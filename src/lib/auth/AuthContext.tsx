'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useRole } from '@/hooks/useRole';
import { usePermissions } from '@/hooks/usePermissions';
import type {
  AuthUser,
  LoginCredentials,
  SignupCredentials,
} from '@/lib/types/auth';
import type { UserRole } from '@/types/navigation';
import type { Resource, Action } from '@/lib/auth/permissions';

interface AuthContextType {
  // User state
  user: AuthUser | null;
  loading: boolean;
  error: string | null;

  // Session state
  session: unknown;
  isSessionValid: () => boolean;
  getTimeUntilExpiry: () => number;
  refreshSession: () => Promise<{ success: boolean; error?: string }>;

  // Role state
  currentRole: UserRole;
  displayName: string;
  description: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isUser: boolean;
  canManageRole: (targetRole: UserRole) => boolean;
  hasMinimumRole: (requiredRole: UserRole) => boolean;
  canAccessFeature: (feature: string) => boolean;
  getRoleLevel: number;
  isGuest: boolean;

  // Permissions
  canPerformAction: (resource: Resource, action: Action) => boolean;
  canRead: (resource: Resource) => boolean;
  canWrite: (resource: Resource) => boolean;
  canDelete: (resource: Resource) => boolean;
  hasAdminAccess: (resource: Resource) => boolean;
  getAllowedActions: (resource: Resource) => Action[];
  canAccessAdmin: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canEditOwnProfile: boolean;
  userRole: UserRole | undefined;

  // Auth actions
  login: (
    credentials: LoginCredentials
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    credentials: SignupCredentials
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;

  // Event handlers
  onAuthStateChange: (callback: (user: AuthUser | null) => void) => () => void;
  onSessionChange: (callback: (session: unknown) => void) => () => void;
  onRoleChange: (callback: (role: UserRole) => void) => () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();
  const session = useSession();
  const role = useRole();
  const permissions = usePermissions();

  const onAuthStateChange = useCallback(
    (_callback: (user: AuthUser | null) => void) => {
      // This would typically be implemented with a subscription to auth state changes
      // For now, we'll return a no-op function
      return () => {};
    },
    []
  );

  const onSessionChange = useCallback(
    (_callback: (session: unknown) => void) => {
      // This would typically be implemented with a subscription to session changes
      // For now, we'll return a no-op function
      return () => {};
    },
    []
  );

  const onRoleChange = useCallback((_callback: (role: UserRole) => void) => {
    // This would typically be implemented with a subscription to role changes
    // For now, we'll return a no-op function
    return () => {};
  }, []);

  const contextValue: AuthContextType = {
    // User state
    user: auth.user,
    loading: auth.loading,
    error: auth.error,

    // Session state
    session: session.session,
    isSessionValid: session.isSessionValid,
    getTimeUntilExpiry: session.getTimeUntilExpiry,
    refreshSession: session.refreshSession,

    // Role state
    currentRole: role.currentRole,
    displayName: role.displayName,
    description: role.description,
    isAdmin: role.isAdmin,
    isAuthenticated: role.isAuthenticated,
    isUser: role.isUser,
    canManageRole: role.canManageRole,
    hasMinimumRole: role.hasMinimumRole,
    canAccessFeature:
      typeof role.canAccessFeature === 'function'
        ? role.canAccessFeature
        : () => false,
    getRoleLevel: role.getRoleLevel,
    isGuest: role.isGuest,

    // Permissions
    canPerformAction: permissions.canPerformAction,
    canRead: permissions.canRead,
    canWrite: permissions.canWrite,
    canDelete: permissions.canDelete,
    hasAdminAccess: permissions.hasAdminAccess,
    getAllowedActions: permissions.getAllowedActions,
    canAccessAdmin: permissions.canAccessAdmin,
    canManageUsers: permissions.canManageUsers,
    canViewAnalytics: permissions.canViewAnalytics,
    canEditOwnProfile: permissions.canEditOwnProfile,
    userRole: permissions.userRole,

    // Auth actions
    login: auth.login,
    signup: auth.signup,
    logout: auth.logout,

    // Event handlers
    onAuthStateChange,
    onSessionChange,
    onRoleChange,
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

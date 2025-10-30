'use client';

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  hasMinimumRole,
  isAdmin,
  isAuthenticatedRole,
  isUser,
  getRoleDisplayName,
  getRoleDescription,
  canManageRole,
} from '@/lib/auth/roles';
import type { UserRole } from '@/types/navigation';

export const useRole = () => {
  const { user } = useAuth();

  const role = useMemo(() => {
    if (!user) {
      return {
        currentRole: 'guest' as UserRole,
        displayName: 'Guest',
        description: 'Not signed in',
        isAdmin: false,
        isAuthenticated: false,
        isUser: false,
        canManageRole: () => false,
        hasMinimumRole: () => false,
      };
    }

    return {
      currentRole: user.role,
      displayName: getRoleDisplayName(user.role),
      description: getRoleDescription(user.role),
      isAdmin: isAdmin(user.role),
      isAuthenticated: isAuthenticatedRole(user.role),
      isUser: isUser(user.role),
      canManageRole: (targetRole: UserRole) =>
        canManageRole(user.role, targetRole),
      hasMinimumRole: (requiredRole: UserRole) =>
        hasMinimumRole(user.role, requiredRole),
    };
  }, [user]);

  const canAccessFeature = useMemo(() => {
    if (!user) return false;

    return (feature: string) => {
      switch (feature) {
        case 'admin':
          return user.role === 'admin';
        case 'analytics':
          return user.role === 'user' || user.role === 'admin';
        case 'user_management':
          return user.role === 'admin';
        case 'profile_editing':
          return user.role === 'user' || user.role === 'admin';
        case 'data_export':
          return user.role === 'admin';
        default:
          return true; // Any authenticated user can access default features
      }
    };
  }, [user]);

  const getRoleLevel = useMemo(() => {
    if (!user) return 0;

    const roleLevels = {
      guest: 0,
      user: 1,
      admin: 2,
      moderator: 1.5,
    };

    return roleLevels[user.role];
  }, [user]);

  return {
    ...role,
    canAccessFeature,
    getRoleLevel,
    isGuest: !user, // No user means guest
  };
};

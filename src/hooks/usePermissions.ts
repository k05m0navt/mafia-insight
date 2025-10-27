'use client';

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  canPerformAction,
  canRead,
  canWrite,
  canDelete,
  hasAdminAccess,
  getAllowedActions,
} from '@/lib/auth/permissions';
import type { Resource, Action } from '@/lib/auth/permissions';

export const usePermissions = () => {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        canPerformAction: () => false,
        canRead: () => false,
        canWrite: () => false,
        canDelete: () => false,
        hasAdminAccess: () => false,
        getAllowedActions: () => [],
      };
    }

    return {
      canPerformAction: (resource: Resource, action: Action) =>
        canPerformAction(user.role, resource, action),
      canRead: (resource: Resource) => canRead(user.role, resource),
      canWrite: (resource: Resource) => canWrite(user.role, resource),
      canDelete: (resource: Resource) => canDelete(user.role, resource),
      hasAdminAccess: (resource: Resource) =>
        hasAdminAccess(user.role, resource),
      getAllowedActions: (resource: Resource) =>
        getAllowedActions(user.role, resource),
    };
  }, [user]);

  const canAccessAdmin = useMemo(() => {
    return user?.role === 'ADMIN';
  }, [user?.role]);

  const canManageUsers = useMemo(() => {
    return user?.role === 'ADMIN';
  }, [user?.role]);

  const canViewAnalytics = useMemo(() => {
    return user?.role === 'USER' || user?.role === 'ADMIN';
  }, [user?.role]);

  const canEditOwnProfile = useMemo(() => {
    return user?.role === 'USER' || user?.role === 'ADMIN';
  }, [user?.role]);

  return {
    ...permissions,
    canAccessAdmin,
    canManageUsers,
    canViewAnalytics,
    canEditOwnProfile,
    userRole: user?.role,
    isAuthenticated: !!user,
  };
};

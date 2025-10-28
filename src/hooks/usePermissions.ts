'use client';

import { useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { permissionService } from '@/lib/permissions';

export function usePermissions() {
  const { authState } = useAuth();

  const permissions = useMemo(() => {
    if (!authState.isAuthenticated || !authState.user) {
      return [];
    }
    return permissionService.getPermissions();
  }, [authState.isAuthenticated, authState.user]);

  const hasPermission = (permission: string): boolean => {
    return permissionService.hasPermission(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissionService.hasAnyPermission(permissions);
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissionService.hasAllPermissions(permissions);
  };

  const canAccessPage = (pageId: string): boolean => {
    try {
      return permissionService.canAccessPage(pageId);
    } catch (error) {
      console.error('Error checking page access:', error);
      return false;
    }
  };

  const canAccessResource = (resource: string, action: string): boolean => {
    return permissionService.canAccessResource(resource, action);
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessPage,
    canAccessResource,
  };
}

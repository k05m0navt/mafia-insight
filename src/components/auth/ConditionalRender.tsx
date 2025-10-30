'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { usePermissions } from '@/hooks/usePermissions';
import type { UserRole } from '@/types/navigation';
import type { Resource, Action } from '@/lib/auth/permissions';

interface ConditionalRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;

  // Authentication conditions
  requireAuth?: boolean;
  requireGuest?: boolean;

  // Role conditions
  requireRole?: UserRole;
  requireAnyRole?: UserRole[];
  requireAllRoles?: UserRole[];

  // Permission conditions
  requirePermission?: {
    resource: Resource;
    action: Action;
  };
  requireAnyPermission?: Array<{
    resource: Resource;
    action: Action;
  }>;
  requireAllPermissions?: Array<{
    resource: Resource;
    action: Action;
  }>;

  // Feature conditions
  requireFeature?: string;
  requireAnyFeature?: string[];
  requireAllFeatures?: string[];

  // Custom condition
  condition?: () => boolean;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  fallback = null,
  requireAuth,
  requireGuest,
  requireRole,
  requireAnyRole,
  requireAllRoles,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireFeature,
  requireAnyFeature,
  requireAllFeatures,
  condition,
}) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { currentRole, hasMinimumRole, canAccessFeature } = useRole();
  const { canPerformAction } = usePermissions();

  const shouldRender = () => {
    // Custom condition takes precedence
    if (condition) {
      return condition();
    }

    // Authentication conditions
    if (requireAuth && !isAuthenticated) return false;
    if (requireGuest && isAuthenticated) return false;

    // Role conditions
    if (requireRole && !hasMinimumRole(requireRole)) return false;

    if (requireAnyRole && requireAnyRole.length > 0) {
      const hasAnyRole = requireAnyRole.some((role) => {
        if (role === currentRole) return true;
        return hasMinimumRole(role);
      });
      if (!hasAnyRole) return false;
    }

    if (requireAllRoles && requireAllRoles.length > 0) {
      const hasAllRoles = requireAllRoles.every((role) => {
        if (role === currentRole) return true;
        return hasMinimumRole(role);
      });
      if (!hasAllRoles) return false;
    }

    // Permission conditions
    if (
      requirePermission &&
      !canPerformAction(requirePermission.action)
    ) {
      return false;
    }

    if (requireAnyPermission && requireAnyPermission.length > 0) {
      const hasAnyPermission = requireAnyPermission.some((perm) =>
        canPerformAction(perm.action)
      );
      if (!hasAnyPermission) return false;
    }

    if (requireAllPermissions && requireAllPermissions.length > 0) {
      const hasAllPermissions = requireAllPermissions.every((perm) =>
        canPerformAction(perm.action)
      );
      if (!hasAllPermissions) return false;
    }

    // Feature conditions
    if (
      requireFeature &&
      typeof canAccessFeature === 'function' &&
      !canAccessFeature(requireFeature)
    )
      return false;

    if (requireAnyFeature && requireAnyFeature.length > 0) {
      const hasAnyFeature = requireAnyFeature.some(
        (feature) =>
          typeof canAccessFeature === 'function' && canAccessFeature(feature)
      );
      if (!hasAnyFeature) return false;
    }

    if (requireAllFeatures && requireAllFeatures.length > 0) {
      const hasAllFeatures = requireAllFeatures.every(
        (feature) =>
          typeof canAccessFeature === 'function' && canAccessFeature(feature)
      );
      if (!hasAllFeatures) return false;
    }

    return true;
  };

  if (!shouldRender()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

'use client';

import React from 'react';
import { useRole } from '@/hooks/useRole';
import type { UserRole } from '@/types/navigation';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback = null,
  requireAll = false,
}) => {
  const { currentRole, hasMinimumRole } = useRole();

  const hasAccess = () => {
    if (requireAll) {
      // User must have all specified roles (not applicable for single role system)
      return allowedRoles.includes(currentRole);
    } else {
      // User must have at least one of the specified roles
      return allowedRoles.some((role) => {
        if (role === currentRole) return true;
        // Check if user has minimum role level
        return hasMinimumRole(role);
      });
    }
  };

  if (!hasAccess()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

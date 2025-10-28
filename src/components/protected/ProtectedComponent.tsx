'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedComponentProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedComponent({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
}: ProtectedComponentProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissions();

  // If no permissions specified, show component
  if (!permission && permissions.length === 0) {
    return <>{children}</>;
  }

  // Check single permission
  if (permission) {
    if (!hasPermission(permission)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { Resource, Action } from '@/lib/auth/permissions';

interface PermissionGateProps {
  children: React.ReactNode;
  resource: Resource;
  action: Action;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  resource: _resource,
  action,
  fallback = null,
  requireAll = false,
}) => {
  const { canPerformAction } = usePermissions();

  const hasPermission = () => {
    if (requireAll) {
      // For now, we only check single permission
      // This could be extended to check multiple permissions
      return canPerformAction(action);
    } else {
      return canPerformAction(action);
    }
  };

  if (!hasPermission()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

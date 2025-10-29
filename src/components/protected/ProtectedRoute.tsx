'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from './AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requireAuth = true,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions();

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    return fallback || <AccessDenied reason="authentication" />;
  }

  // Check if permissions are required
  if (requiredPermissions.length > 0) {
    const hasAllRequiredPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    );
    
    if (!hasAllRequiredPermissions) {
      return (
        fallback || (
          <AccessDenied
            reason="permissions"
            requiredPermissions={requiredPermissions}
          />
        )
      );
    }
  }

  return <>{children}</>;
}

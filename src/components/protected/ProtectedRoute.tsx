'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
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
  const { authState } = useAuth();
  const { hasAllPermissions } = usePermissions();

  // Check if authentication is required
  if (requireAuth && !authState.isAuthenticated) {
    return fallback || <AccessDenied reason="authentication" />;
  }

  // Check if permissions are required
  if (
    requiredPermissions.length > 0 &&
    !hasAllPermissions(requiredPermissions)
  ) {
    return (
      fallback || (
        <AccessDenied
          reason="permissions"
          requiredPermissions={requiredPermissions}
        />
      )
    );
  }

  return <>{children}</>;
}

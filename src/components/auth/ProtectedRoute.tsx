'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { UserRole } from '@/types/navigation';
import type { Resource, Action } from '@/lib/auth/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: {
    resource: Resource;
    action: Action;
  };
  fallback?: React.ReactNode;
  redirectTo?: string;
  className?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  redirectTo = '/unauthorized',
  className = '',
}) => {
  const { user, loading } = useAuth();
  const { currentRole, hasMinimumRole } = useRole();
  const { canPerformAction } = usePermissions();

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={className}>
        {fallback || (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-500" />
                Authentication Required
              </CardTitle>
              <CardDescription>
                You need to sign in to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This page requires authentication. Please sign in to continue.
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Check role requirement
  if (requiredRole && !hasMinimumRole(requiredRole)) {
    return (
      <div className={className}>
        {fallback || (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Insufficient Permissions
              </CardTitle>
              <CardDescription>
                You don't have the required role to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This page requires {requiredRole} role or higher. Your current
                  role is {currentRole}.
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href={redirectTo}>Go Back</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Check permission requirement
  if (
    requiredPermission &&
    !canPerformAction(requiredPermission.resource, requiredPermission.action)
  ) {
    return (
      <div className={className}>
        {fallback || (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Access Denied
              </CardTitle>
              <CardDescription>
                You don't have permission to perform this action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You need {requiredPermission.action} permission on{' '}
                  {requiredPermission.resource} to access this page.
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href={redirectTo}>Go Back</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

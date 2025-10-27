'use client';

import React from 'react';
import { useRole } from '@/hooks/useRole';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface GuestOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
  className?: string;
}

export const GuestOnly: React.FC<GuestOnlyProps> = ({
  children,
  fallback,
  showAccessDenied = true,
  className = '',
}) => {
  const { isGuest, isAuthenticated, currentRole } = useRole();

  if (isAuthenticated && !isGuest) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showAccessDenied) {
      return null;
    }

    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" />
              Already Signed In
            </CardTitle>
            <CardDescription>
              This content is only available to guests (non-signed-in users).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are already signed in as {currentRole}. This content is only
                available to guests.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

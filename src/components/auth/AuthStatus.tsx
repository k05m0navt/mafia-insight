'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { useRole } from '@/hooks/useRole';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
// import { formatDistanceToNow } from 'date-fns';

interface AuthStatusProps {
  variant?: 'default' | 'compact' | 'card';
  showActions?: boolean;
  className?: string;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({
  variant = 'default',
  showActions = true,
  className = '',
}) => {
  const { user, isLoading: loading, error, logout } = useAuth();
  const { token, expiresAt, isValid: isSessionValid, isExpired: isExpiredFn } = useSession();
  const { description, isAdmin, isAuthenticated } = useRole();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Authentication error</span>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Not signed in</span>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (isAdmin) {
      return <Shield className="h-4 w-4 text-red-600" />;
    }
    return <User className="h-4 w-4 text-blue-600" />;
  };

  const getStatusBadge = () => {
    if (isAdmin) {
      return <Badge variant="destructive">Admin</Badge>;
    }
    return <Badge variant="default">User</Badge>;
  };

  const getTimeUntilExpiry = () => {
    if (!expiresAt) return 0;
    return Math.max(0, expiresAt.getTime() - new Date().getTime());
  };

  const getSessionStatus = () => {
    if (!token || !expiresAt) return null;

    const timeUntilExpiry = getTimeUntilExpiry();
    const isValid = isSessionValid && !isExpiredFn();

    if (isValid) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-3 w-3" />
          <span className="text-xs">
            Session expires in {Math.floor(timeUntilExpiry / 60000)}m
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-orange-600">
        <Clock className="h-3 w-3" />
        <span className="text-xs">Session expiring soon</span>
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{user.name}</span>
        {getStatusBadge()}
        {getSessionStatus()}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getStatusIcon()}
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {getStatusBadge()}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>{description}</p>
          </div>

          {getSessionStatus()}

          {showActions && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="font-medium">{user.name}</span>
        {getStatusBadge()}
      </div>

      <div className="text-sm text-muted-foreground">
        <p>{user.email}</p>
        <p>{description}</p>
      </div>

      {getSessionStatus()}
    </div>
  );
};

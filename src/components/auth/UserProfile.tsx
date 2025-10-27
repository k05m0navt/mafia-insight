'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Settings,
  Edit,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useSession } from '@/hooks/useSession';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface UserProfileProps {
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  variant = 'default',
  showActions = true,
  className = '',
}) => {
  const { user, loading } = useAuth();
  const { description, isAdmin, isAuthenticated } = useRole();
  const { session, isSessionValid, getTimeUntilExpiry } = useSession();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading profile...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Not signed in</p>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSessionStatus = () => {
    if (!session) return null;

    const timeUntilExpiry = getTimeUntilExpiry();
    const isValid = isSessionValid();

    if (isValid) {
      return (
        <div className="text-sm text-green-600">
          Session expires in {Math.floor(timeUntilExpiry / 60)} minutes
        </div>
      );
    }

    return <div className="text-sm text-orange-600">Session expiring soon</div>;
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.name}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            {isAdmin ? (
              <Badge variant="destructive" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            ) : (
              <Badge variant="default" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                User
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
          <CardDescription>
            Your account information and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {isAdmin ? (
                  <Badge variant="destructive">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrator
                  </Badge>
                ) : (
                  <Badge variant="default">
                    <User className="h-3 w-3 mr-1" />
                    User
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Member since</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>

            {user.lastLoginAt && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last login</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(user.lastLoginAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </div>

          {getSessionStatus() && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                {getSessionStatus()}
              </div>
            </>
          )}

          {showActions && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/profile/edit" className="flex items-center">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {isAdmin ? (
                <Badge variant="destructive" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              ) : (
                <Badge variant="default" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  User
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>{description}</p>
        </div>

        {getSessionStatus() && (
          <div className="text-sm text-muted-foreground">
            {getSessionStatus()}
          </div>
        )}

        {showActions && (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/profile/edit" className="flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

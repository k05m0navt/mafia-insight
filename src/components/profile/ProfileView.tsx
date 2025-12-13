'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  User,
  Calendar,
  Clock,
  Settings,
  Edit,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface ProfileViewProps {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
    role?: string;
    subscriptionTier?: string;
    themePreference?: string | null;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    createdAt: Date;
    lastLogin?: Date | null;
  };
}

/**
 * ProfileView component
 * Displays user profile information in a read-only view
 *
 * Features:
 * - Displays email, name, avatar, account creation date, last login
 * - Shows preferences section (theme preference, notification settings)
 * - WCAG 2.1 Level AA accessible
 * - Responsive design
 */
export function ProfileView({ user }: ProfileViewProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" aria-hidden="true" />
          Profile Information
        </CardTitle>
        <CardDescription>Your account details and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
          <Avatar className="h-24 w-24" data-testid="profile-avatar-container">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-2">
              {user.role && (
                <Badge
                  variant={getRoleBadgeVariant(user.role)}
                  className="capitalize"
                >
                  <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
                  {user.role}
                </Badge>
              )}
              {user.subscriptionTier && (
                <Badge variant="outline" className="capitalize">
                  {user.subscriptionTier.toLowerCase()}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Email Address */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span>Email Address</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground break-all">
              {user.email}
            </p>
            <Button
              variant="ghost"
              size="sm"
              asChild
              aria-label="Edit email address"
            >
              <Link href="/profile?edit=email">
                <Edit className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Display Name */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span>Display Name</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{user.name}</p>
            <Button
              variant="ghost"
              size="sm"
              asChild
              aria-label="Edit display name"
            >
              <Link href="/profile?edit=name">
                <Edit className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Account Creation Date */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span>Account Created</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(user.createdAt), 'MMMM d, yyyy')}
          </p>
        </div>

        {/* Last Login */}
        {user.lastLogin && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>Last Login</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(user.lastLogin), 'MMMM d, yyyy HH:mm')}
              </p>
            </div>
          </>
        )}

        <Separator />

        {/* Preferences Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span>Preferences</span>
          </div>

          {/* Theme Preference */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Theme</p>
            <p className="text-sm capitalize">
              {user.themePreference || 'system'}
            </p>
          </div>

          {/* Notification Settings */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Email Notifications</p>
            <p className="text-sm">
              {user.emailNotifications !== false ? 'Enabled' : 'Disabled'}
            </p>
            <p className="text-xs text-muted-foreground">Push Notifications</p>
            <p className="text-sm">
              {user.pushNotifications ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Edit Profile Button */}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/profile?edit=true">
            <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
            Edit Profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

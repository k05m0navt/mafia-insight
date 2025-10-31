'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileHeaderProps {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
    role?: string;
    subscriptionTier?: string;
    createdAt: Date;
    lastLogin?: Date | null;
  };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
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
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Avatar */}
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.avatar || undefined} alt={user.name} />
          <AvatarFallback className="text-2xl">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{user.email}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {user.role && (
              <Badge
                variant={getRoleBadgeVariant(user.role)}
                className="capitalize"
              >
                <Shield className="h-3 w-3 mr-1" />
                {user.role}
              </Badge>
            )}
            {user.subscriptionTier && (
              <Badge variant="outline" className="capitalize">
                {user.subscriptionTier.toLowerCase()}
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
            {user.lastLogin && (
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>
                  Last login{' '}
                  {format(new Date(user.lastLogin), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

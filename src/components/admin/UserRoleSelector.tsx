'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, User, UserCheck } from 'lucide-react';
import type { UserRole } from '@/types/navigation';

interface UserRoleSelectorProps {
  value: UserRole;
  onValueChange: (role: UserRole) => void;
  disabled?: boolean;
  className?: string;
}

const roleConfig = {
  GUEST: {
    label: 'Guest',
    description: 'Can view public content only',
    icon: User,
    variant: 'secondary' as const,
  },
  USER: {
    label: 'User',
    description: 'Can access protected features and manage own data',
    icon: UserCheck,
    variant: 'default' as const,
  },
  ADMIN: {
    label: 'Administrator',
    description: 'Can manage users and access all features',
    icon: Shield,
    variant: 'destructive' as const,
  },
};

export const UserRoleSelector: React.FC<UserRoleSelectorProps> = ({
  value,
  onValueChange,
  disabled = false,
  className = '',
}) => {
  const currentRole = roleConfig[value];
  const Icon = currentRole.icon;

  return (
    <div className={`space-y-2 ${className}`}>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{currentRole.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(roleConfig).map(([role, config]) => {
            const RoleIcon = config.icon;
            return (
              <SelectItem key={role} value={role}>
                <div className="flex items-center gap-2">
                  <RoleIcon className="h-4 w-4" />
                  <span>{config.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Badge variant={currentRole.variant} className="text-xs">
          <Icon className="h-3 w-3 mr-1" />
          {currentRole.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {currentRole.description}
        </span>
      </div>
    </div>
  );
};

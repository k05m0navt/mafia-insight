/**
 * RoleFilter - Component for filtering analytics by role
 *
 * Provides toggle buttons for selecting one or more roles (Don, Mafia, Sheriff, Citizen).
 * Supports multi-select functionality with clear/reset option.
 * Integrates with Zustand analytics store for filter state.
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PlayerRole } from '@/types/analytics';
import {
  ALL_ROLES,
  ROLE_DISPLAY_NAMES,
  ROLE_COLORS,
} from '@/lib/utils/roleFilter';

/**
 * Props for RoleFilter component
 */
export interface RoleFilterProps {
  /** Current selected roles */
  value: PlayerRole[];
  /** Callback when roles change */
  onChange: (roles: PlayerRole[]) => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * RoleFilter Component
 */
export function RoleFilter({ value, onChange, className }: RoleFilterProps) {
  const handleRoleToggle = (role: PlayerRole) => {
    const isSelected = value.includes(role);
    if (isSelected) {
      // Remove role from selection
      onChange(value.filter((r) => r !== role));
    } else {
      // Add role to selection
      onChange([...value, role]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const hasSelection = value.length > 0;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Role Toggle Buttons */}
      <div className="flex flex-wrap gap-2">
        {ALL_ROLES.map((role) => {
          const isSelected = value.includes(role);
          return (
            <Button
              key={role}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleToggle(role)}
              className={cn(
                'transition-all duration-200',
                isSelected && 'shadow-md',
                // Add role-specific colors when selected
                isSelected && ROLE_COLORS[role]
              )}
            >
              {ROLE_DISPLAY_NAMES[role]}
            </Button>
          );
        })}
      </div>

      {/* Clear Button */}
      {hasSelection && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Active Filter Indicator */}
      {hasSelection && (
        <div className="text-sm text-muted-foreground">
          Filtering by:{' '}
          <span className="font-medium">
            {value.map((role) => ROLE_DISPLAY_NAMES[role]).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}

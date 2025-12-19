/**
 * FilterIndicator - Component for displaying active filters
 *
 * Shows the active date range and role filters with labels and clear buttons.
 * Displays loading state when data is being fetched.
 */

'use client';

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DateRange, PlayerRole } from '@/types/analytics';
import { formatDateRangeLabel } from '@/lib/utils/dateRange';
import { formatRoleFilterLabel } from '@/lib/utils/roleFilter';

/**
 * Props for FilterIndicator component
 */
export interface FilterIndicatorProps {
  /** Current date range filter value */
  dateRange: DateRange | null;
  /** Callback when date range clear button is clicked */
  onClearDateRange: () => void;
  /** Current role filter value */
  roles: PlayerRole[];
  /** Callback when role filter clear button is clicked */
  onClearRoles: () => void;
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * FilterIndicator Component
 */
export function FilterIndicator({
  dateRange,
  onClearDateRange,
  roles,
  onClearRoles,
  isLoading = false,
  className,
}: FilterIndicatorProps) {
  const hasDateRange = dateRange !== null;
  const hasRoles = roles.length > 0;
  const hasAnyFilter = hasDateRange || hasRoles;

  if (!hasAnyFilter) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {/* Date Range Filter Badge */}
      {hasDateRange && (
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-md border bg-muted px-3 py-1.5 text-sm transition-opacity duration-200',
            isLoading && 'opacity-75'
          )}
        >
          <span className="text-muted-foreground">Date:</span>
          <span className="font-medium">{formatDateRangeLabel(dateRange)}</span>
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearDateRange}
            className="h-auto p-0.5 hover:bg-transparent"
            aria-label="Clear date range filter"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      )}

      {/* Role Filter Badge */}
      {hasRoles && (
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-md border bg-muted px-3 py-1.5 text-sm transition-opacity duration-200',
            isLoading && 'opacity-75'
          )}
        >
          <span className="text-muted-foreground">Roles:</span>
          <span className="font-medium">{formatRoleFilterLabel(roles)}</span>
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearRoles}
            className="h-auto p-0.5 hover:bg-transparent"
            aria-label="Clear role filter"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      )}
    </div>
  );
}

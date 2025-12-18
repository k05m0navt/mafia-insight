/**
 * FilterIndicator - Component for displaying active date range filter
 *
 * Shows the active date range filter with a label and clear button.
 * Displays loading state when data is being fetched.
 */

'use client';

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DateRange } from '@/types/analytics';
import { formatDateRangeLabel } from '@/lib/utils/dateRange';

/**
 * Props for FilterIndicator component
 */
export interface FilterIndicatorProps {
  /** Current date range filter value */
  dateRange: DateRange | null;
  /** Callback when clear button is clicked */
  onClear: () => void;
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
  onClear,
  isLoading = false,
  className,
}: FilterIndicatorProps) {
  if (!dateRange) {
    return null;
  }

  const label = formatDateRangeLabel(dateRange);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-md border bg-muted px-3 py-1.5 text-sm transition-opacity duration-200',
        isLoading && 'opacity-75',
        className
      )}
    >
      <span className="text-muted-foreground">Showing:</span>
      <span className="font-medium">{label}</span>
      {isLoading && (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-auto p-0.5 hover:bg-transparent"
        aria-label="Clear date range filter"
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </Button>
    </div>
  );
}

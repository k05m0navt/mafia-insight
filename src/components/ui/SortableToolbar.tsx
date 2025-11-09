'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortOption {
  key: string;
  label: string;
}

interface SortableToolbarProps {
  label?: string;
  sortOptions: SortOption[];
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  className?: string;
}

export function SortableToolbar({
  label = 'Sort by',
  sortOptions,
  currentSortBy,
  currentSortOrder,
  onSort,
  className,
}: SortableToolbarProps) {
  const handleSort = (sortKey: string) => {
    if (currentSortBy === sortKey) {
      // Toggle between asc and desc
      onSort(sortKey, currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set to ascending by default
      onSort(sortKey, 'asc');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <div className="flex items-center">
        <span className="text-sm font-medium text-muted-foreground">
          {label}:
        </span>
      </div>

      {/* Mobile: Stack vertically with full-width buttons */}
      {/* Desktop: Horizontal layout with compact buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
        {sortOptions.map((option) => {
          const isSorted = currentSortBy === option.key;
          const isAscending = isSorted && currentSortOrder === 'asc';

          return (
            <Button
              key={option.key}
              variant={isSorted ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleSort(option.key)}
              className="w-full sm:w-auto h-9 sm:h-8 gap-1.5 justify-between sm:justify-center"
            >
              <span className="text-sm">{option.label}</span>
              {isSorted ? (
                isAscending ? (
                  <ArrowUp className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5 flex-shrink-0" />
                )
              ) : (
                <ArrowUpDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

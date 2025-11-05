'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { TableHead } from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  className?: string;
}

export function SortableTableHead({
  children,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isSorted = currentSortBy === sortKey;
  const isAscending = isSorted && currentSortOrder === 'asc';

  const handleClick = () => {
    if (isSorted) {
      // Toggle between asc and desc
      onSort(sortKey, currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set to ascending by default
      onSort(sortKey, 'asc');
    }
  };

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="h-auto p-0 font-medium hover:bg-transparent -ml-2"
      >
        {children}
        {isSorted ? (
          isAscending ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    </TableHead>
  );
}

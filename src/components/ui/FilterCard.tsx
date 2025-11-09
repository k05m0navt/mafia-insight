'use client';

import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface FilterCardProps {
  title?: string;
  children: React.ReactNode;
  activeFilters?: ActiveFilter[];
  onClearAll?: () => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

function FilterCardComponent({
  title = 'Filters',
  children,
  activeFilters = [],
  onClearAll,
  collapsible = false,
  defaultCollapsed = false,
  className,
}: FilterCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <Card className={cn('transition-all duration-200', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {activeFilters.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && onClearAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-xs h-7"
              >
                Clear All
              </Button>
            )}
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-7 w-7 p-0"
                aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Badges */}
        {hasActiveFilters && !isCollapsed && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            {activeFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20"
              >
                <span className="font-normal text-muted-foreground">
                  {filter.label}:
                </span>
                <span>{filter.value}</span>
                <button
                  onClick={filter.onRemove}
                  className="ml-0.5 hover:text-destructive transition-colors"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {!isCollapsed && <CardContent className="pt-4">{children}</CardContent>}
    </Card>
  );
}

export const FilterCard = memo(FilterCardComponent);
FilterCard.displayName = 'FilterCard';

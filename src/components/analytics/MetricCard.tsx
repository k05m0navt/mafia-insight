/**
 * MetricCard - Reusable component for displaying individual performance metrics
 *
 * Displays large numbers with icons, supports percentage displays, conditional rendering,
 * smooth animations for value changes, and color coding for positive/negative indicators.
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  /**
   * Title/label for the metric
   */
  title: string;
  /**
   * Value to display (number or string)
   */
  value: number | string;
  /**
   * Optional icon to display
   */
  icon?: LucideIcon;
  /**
   * Optional description/subtitle
   */
  description?: string;
  /**
   * Optional unit to display after value (e.g., "%", "games", "min")
   */
  unit?: string;
  /**
   * Color variant for the metric
   */
  variant?: 'default' | 'positive' | 'negative' | 'neutral';
  /**
   * Whether to show as percentage (formats value with %)
   */
  showPercentage?: boolean;
  /**
   * Optional trend indicator (up/down/stable)
   */
  trend?: 'up' | 'down' | 'stable';
  /**
   * Optional trend value (e.g., "+5.2%")
   */
  trendValue?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to animate value changes
   */
  animate?: boolean;
}

/**
 * MetricCard component for displaying performance metrics
 */
export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  unit,
  variant = 'default',
  showPercentage = false,
  trend,
  trendValue,
  className,
  animate = true,
}: MetricCardProps) {
  // Format value based on type
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') {
      return val;
    }
    if (showPercentage) {
      return val.toFixed(1);
    }
    // Format large numbers with commas
    return val.toLocaleString('en-US');
  };

  // Determine color classes based on variant
  const variantClasses = {
    default: 'text-foreground',
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground',
  };

  // Trend icon and color
  const trendConfig = {
    up: { icon: '↑', color: 'text-green-600 dark:text-green-400' },
    down: { icon: '↓', color: 'text-red-600 dark:text-red-400' },
    stable: { icon: '→', color: 'text-muted-foreground' },
  };

  const trendInfo = trend ? trendConfig[trend] : null;

  return (
    <Card
      variant="metric"
      className={cn(
        'transition-all duration-300',
        animate && 'hover:shadow-md',
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {Icon && (
                <Icon
                  className={cn(
                    'h-4 w-4',
                    variantClasses[variant],
                    'opacity-70'
                  )}
                />
              )}
              <span className="text-sm font-medium text-muted-foreground">
                {title}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-3xl font-bold tracking-tight',
                  variantClasses[variant]
                )}
              >
                {formatValue(value)}
              </span>
              {unit && (
                <span className="text-lg text-muted-foreground">{unit}</span>
              )}
              {showPercentage && (
                <span className="text-lg text-muted-foreground">%</span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
            {trend && trendInfo && (
              <div className="flex items-center gap-1 mt-2">
                <span className={cn('text-xs font-medium', trendInfo.color)}>
                  {trendInfo.icon}
                </span>
                {trendValue && (
                  <span className={cn('text-xs', trendInfo.color)}>
                    {trendValue}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

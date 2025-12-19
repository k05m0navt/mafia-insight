/**
 * TrendComparison - Component for displaying comparative analysis
 *
 * Shows current period vs previous period metrics with percentage change indicators,
 * up/down arrows, and color-coded improvements/declines.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrendComparison as TrendComparisonType } from '@/types/analytics';
import { format } from 'date-fns';

/**
 * Format period label for display
 */
function formatPeriodLabel(
  startDate: string,
  _endDate: string,
  period: 'week' | 'month' | 'quarter'
): string {
  const start = new Date(startDate);

  switch (period) {
    case 'week':
      return `Week of ${format(start, 'MMM d, yyyy')}`;
    case 'month':
      return format(start, 'MMMM yyyy');
    case 'quarter': {
      const quarter = Math.floor(start.getMonth() / 3) + 1;
      return `Q${quarter} ${format(start, 'yyyy')}`;
    }
    default:
      return format(start, 'MMM d, yyyy');
  }
}

/**
 * Comparison metric card component
 */
function MetricCard({
  label,
  currentValue,
  previousValue,
  change,
  formatValue,
  isPercentage = false,
}: {
  label: string;
  currentValue: number;
  previousValue: number;
  change: number;
  formatValue: (value: number) => string;
  isPercentage?: boolean;
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <Card variant="outlined" className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current</p>
            <p className="text-2xl font-bold">{formatValue(currentValue)}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'flex items-center gap-1 text-xs',
              isPositive
                ? 'text-green-600 border-green-600'
                : isNegative
                  ? 'text-red-600 border-red-600'
                  : 'text-muted-foreground border-muted-foreground'
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {isPositive ? '+' : ''}
            {isPercentage
              ? `${change.toFixed(1)}%`
              : formatValue(Math.abs(change))}
          </Badge>
        </div>
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Previous</p>
          <p className="text-lg text-muted-foreground">
            {formatValue(previousValue)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * TrendComparison Component
 */
export function TrendComparison({
  comparison,
}: {
  comparison: TrendComparisonType;
}) {
  const { currentPeriod, previousPeriod, change } = comparison;

  return (
    <Card variant="chart">
      <CardHeader>
        <CardTitle>Period Comparison</CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparing{' '}
          {formatPeriodLabel(
            currentPeriod.startDate,
            currentPeriod.endDate,
            currentPeriod.period
          )}{' '}
          vs{' '}
          {formatPeriodLabel(
            previousPeriod.startDate,
            previousPeriod.endDate,
            previousPeriod.period
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Win Rate"
            currentValue={currentPeriod.metrics.winRate}
            previousValue={previousPeriod.metrics.winRate}
            change={change.winRate}
            formatValue={(value) => `${value.toFixed(1)}%`}
            isPercentage={true}
          />
          <MetricCard
            label="Average ELO"
            currentValue={currentPeriod.metrics.elo}
            previousValue={previousPeriod.metrics.elo}
            change={change.elo}
            formatValue={(value) => Math.round(value).toString()}
          />
          <MetricCard
            label="Games Played"
            currentValue={currentPeriod.metrics.gamesPlayed}
            previousValue={previousPeriod.metrics.gamesPlayed}
            change={change.gamesPlayed}
            formatValue={(value) => Math.round(value).toString()}
            isPercentage={true}
          />
        </div>

        {/* Overall Trend Indicator */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Overall Trend</p>
            <Badge
              variant="outline"
              className={cn(
                'flex items-center gap-1',
                currentPeriod.trend === 'up'
                  ? 'text-green-600 border-green-600'
                  : currentPeriod.trend === 'down'
                    ? 'text-red-600 border-red-600'
                    : 'text-muted-foreground border-muted-foreground'
              )}
            >
              {currentPeriod.trend === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : currentPeriod.trend === 'down' ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              {currentPeriod.trend === 'up'
                ? 'Improving'
                : currentPeriod.trend === 'down'
                  ? 'Declining'
                  : 'Stable'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

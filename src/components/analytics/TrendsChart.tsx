/**
 * TrendsChart - Component for displaying performance trends over time
 *
 * Shows time-series charts with key metrics (win rate, ELO, games played),
 * period grouping options, and trend indicators.
 */

'use client';

import React, { lazy, Suspense, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { usePerformanceTrends } from '@/hooks/usePerformanceTrends';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalyticsStore } from '@/store/analyticsStore';
import type { TrendsChartProps, TrendPeriod } from '@/types/analytics';

// Lazy load chart component for code splitting
const ChartContent = lazy(() =>
  import('./TrendsChartContent').then((mod) => ({
    default: mod.ChartContent,
  }))
);

/**
 * Loading skeleton for trends chart
 */
function TrendsChartSkeleton() {
  return (
    <Card variant="chart">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-64 mt-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Period selector component
 */
function PeriodSelector({
  value,
  onChange,
}: {
  value: TrendPeriod;
  onChange: (period: TrendPeriod) => void;
}) {
  const periods: { value: TrendPeriod; label: string }[] = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
  ];

  return (
    <div className="flex gap-2">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(period.value)}
          className="text-xs"
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}

/**
 * Main TrendsChart Component
 */
export function TrendsChart({
  playerId,
  dateRange: propDateRange,
  period: propPeriod = 'month',
}: TrendsChartProps) {
  const [localPeriod, setLocalPeriod] = useState<TrendPeriod>(propPeriod);

  // Get filters from Zustand store, fallback to prop or default
  const { dateRange: storeDateRange, roles: storeRoles } = useAnalyticsStore();
  const effectiveDateRange = storeDateRange || propDateRange || null;
  const effectiveRoles = storeRoles.length > 0 ? storeRoles : undefined;
  const effectivePeriod = localPeriod;

  const { data, isLoading, error } = usePerformanceTrends(
    playerId,
    effectivePeriod,
    effectiveDateRange || undefined,
    effectiveRoles
  );

  // Calculate overall trend indicator from latest trend
  const overallTrend = useMemo(() => {
    if (!data?.trends || data.trends.length === 0) return null;
    const latest = data.trends[data.trends.length - 1];
    return latest.trend;
  }, [data]);

  // Loading state
  if (isLoading) {
    return <TrendsChartSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card variant="outlined" className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Failed to load performance trends: {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || !data.trends || data.trends.length === 0) {
    return (
      <Card variant="chart">
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No trend data available</p>
            <p className="text-sm text-muted-foreground">
              Import game data or select a different time range to view trends.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { trends } = data;
  const latestTrend = trends[trends.length - 1];

  return (
    <Card variant="chart" className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Performance Trends</CardTitle>
            {overallTrend && (
              <Badge
                variant="outline"
                className={cn(
                  'flex items-center gap-1 text-xs',
                  overallTrend === 'up'
                    ? 'text-green-600 border-green-600'
                    : overallTrend === 'down'
                      ? 'text-red-600 border-red-600'
                      : 'text-muted-foreground border-muted-foreground'
                )}
              >
                {overallTrend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : overallTrend === 'down' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {overallTrend === 'up'
                  ? 'Improving'
                  : overallTrend === 'down'
                    ? 'Declining'
                    : 'Stable'}
              </Badge>
            )}
          </div>
          <PeriodSelector value={effectivePeriod} onChange={setLocalPeriod} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Latest Period Summary */}
          {latestTrend && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                <p className="text-2xl font-bold">
                  {latestTrend.metrics.winRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Avg ELO</p>
                <p className="text-2xl font-bold">
                  {Math.round(latestTrend.metrics.elo)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Games</p>
                <p className="text-2xl font-bold">
                  {latestTrend.metrics.gamesPlayed}
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="h-64 w-full">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-muted-foreground">Loading chart...</div>
                </div>
              }
            >
              <ChartContent trends={trends} period={effectivePeriod} />
            </Suspense>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

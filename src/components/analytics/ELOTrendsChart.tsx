/**
 * ELOTrendsChart - Component for displaying ELO rating trends over time
 *
 * Shows current ELO prominently, line chart with ELO progression, historical high/low values,
 * ELO change indicators, and time range selector.
 */

'use client';

import React, { lazy, Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useELOTrends } from '@/hooks/useELOTrends';
import { TimeRangeSelector } from './TimeRangeSelector';
import { AlertCircle, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalyticsStore } from '@/store/analyticsStore';
import type { ELOTrendsChartProps } from '@/types/analytics';

// Lazy load chart component for code splitting
const ChartContent = lazy(() =>
  import('./ELOTrendsChartContent').then((mod) => ({
    default: mod.ChartContent,
  }))
);

/**
 * Format ELO value for display
 */
function formatELO(elo: number): string {
  return Math.round(elo).toString();
}

/**
 * Calculate ELO change indicator
 */
function calculateELOChange(
  trends: Array<{ elo: number }>,
  currentELO: number
): { change: number; isPositive: boolean } | null {
  if (trends.length < 2) {
    return null;
  }

  const previousELO = trends[trends.length - 2].elo;
  const change = currentELO - previousELO;
  return {
    change: Math.round(change),
    isPositive: change >= 0,
  };
}

/**
 * Loading skeleton for ELO trends chart
 */
function ELOTrendsChartSkeleton() {
  return (
    <Card variant="chart">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current ELO skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-16 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          {/* Chart skeleton */}
          <Skeleton className="h-64 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main ELOTrendsChart Component
 */
export function ELOTrendsChart({
  playerId,
  dateRange: propDateRange,
  period = 'day',
}: ELOTrendsChartProps) {
  // Get dateRange from Zustand store, fallback to prop or null (all time)
  const { dateRange: storeDateRange, setDateRange } = useAnalyticsStore();
  const effectiveDateRange = storeDateRange || propDateRange || null;

  const { data, isLoading, error } = useELOTrends(
    playerId,
    effectiveDateRange || undefined,
    period
  );

  // Calculate ELO change indicator
  const eloChange = useMemo(() => {
    if (!data?.trends) return null;
    return calculateELOChange(data.trends, data.currentELO);
  }, [data]);

  // Loading state
  if (isLoading) {
    return <ELOTrendsChartSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card variant="outlined" className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Failed to load ELO trends: {error.message}
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
          <CardTitle>ELO Rating Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No ELO data available</p>
            <p className="text-sm text-muted-foreground mb-4">
              Import game data or select a different time range to view ELO
              trends.
            </p>
            <TimeRangeSelector
              value={effectiveDateRange}
              onChange={setDateRange}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { trends, currentELO, historicalHigh, historicalLow } = data;

  return (
    <Card variant="chart" className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ELO Rating Trends</CardTitle>
          <TimeRangeSelector
            value={effectiveDateRange}
            onChange={setDateRange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current ELO Display */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current ELO</p>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold">{formatELO(currentELO)}</p>
                {eloChange && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'flex items-center gap-1 text-sm',
                      eloChange.isPositive
                        ? 'text-green-600 border-green-600'
                        : 'text-red-600 border-red-600'
                    )}
                  >
                    {eloChange.isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {eloChange.isPositive ? '+' : ''}
                    {eloChange.change}
                  </Badge>
                )}
              </div>
            </div>

            {/* Historical High/Low */}
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">High</p>
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <p className="text-lg font-semibold">
                    {formatELO(historicalHigh)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Low</p>
                <p className="text-lg font-semibold">
                  {formatELO(historicalLow)}
                </p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 w-full">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-muted-foreground">Loading chart...</div>
                </div>
              }
            >
              <ChartContent trends={trends} />
            </Suspense>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

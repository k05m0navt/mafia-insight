/**
 * PerformanceSummary - Component for displaying comprehensive performance statistics and summaries
 *
 * Shows total games, wins/losses, win percentage, average game duration (if available),
 * longest win streak, best ELO achieved, and recent activity (this week, this month).
 * Integrates with analytics store for filter state (date range, roles).
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Gamepad2,
  Trophy,
  XCircle,
  TrendingUp,
  Award,
  Activity,
  Clock,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react';
import { usePerformanceSummary } from '@/hooks/usePerformanceSummary';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { MetricCard } from './MetricCard';
import type { PerformanceSummaryProps } from '@/types/analytics';
import { cn } from '@/lib/utils';

/**
 * Loading skeleton for performance summary
 */
function PerformanceSummarySkeleton() {
  return (
    <div className="space-y-6">
      <Card variant="chart">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <Card variant="chart">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">No Performance Data</h3>
            <p className="text-sm text-muted-foreground mt-2">
              You don't have any game data yet. Import your game data from
              gomafia.pro to see your performance statistics.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Or try selecting a different time range.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main PerformanceSummary Component
 */
export function PerformanceSummary({
  playerId,
  dateRange: propDateRange,
  roles: propRoles,
}: PerformanceSummaryProps) {
  // Get filters from Zustand store, fallback to props or default
  const {
    dateRange: storeDateRange,
    selectedRoles: storeRoles,
    setDateRange,
    setSelectedRoles,
    reset,
  } = useAnalyticsStore();

  const effectiveDateRange = storeDateRange || propDateRange || null;
  const effectiveRoles = storeRoles.length > 0 ? storeRoles : propRoles;

  // Fetch performance summary data
  const {
    data: summary,
    isLoading,
    error,
    isRefetching,
  } = usePerformanceSummary(
    playerId,
    effectiveDateRange || undefined,
    effectiveRoles
  );

  // Loading state
  if (isLoading) {
    return <PerformanceSummarySkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card variant="chart">
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error loading performance summary:</strong>{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state (no data)
  if (!summary || summary.totalGames === 0) {
    return <EmptyState />;
  }

  // Determine variant for win percentage
  const winPercentageVariant =
    summary.winPercentage >= 50 ? 'positive' : 'negative';

  // Check if filters are active
  // A filter is active if:
  // - Date range is set and preset is not 'all_time' (or has custom dates)
  // - Roles are selected
  const hasActiveFilters =
    (effectiveDateRange &&
      (effectiveDateRange.preset
        ? effectiveDateRange.preset !== 'all_time'
        : !!(effectiveDateRange.startDate || effectiveDateRange.endDate))) ||
    (effectiveRoles && effectiveRoles.length > 0);

  // Format date range for display
  const formatDateRange = () => {
    if (effectiveDateRange?.preset) {
      const presetLabels: Record<string, string> = {
        last_month: 'Last Month',
        last_3_months: 'Last 3 Months',
        last_6_months: 'Last 6 Months',
        all_time: 'All Time',
      };
      return (
        presetLabels[effectiveDateRange.preset] || effectiveDateRange.preset
      );
    }
    if (effectiveDateRange?.startDate && effectiveDateRange?.endDate) {
      const start = new Date(effectiveDateRange.startDate).toLocaleDateString();
      const end = new Date(effectiveDateRange.endDate).toLocaleDateString();
      return `${start} - ${end}`;
    }
    return null;
  };

  const dateRangeLabel = formatDateRange();
  const roleLabels =
    effectiveRoles
      ?.map((r) => r.charAt(0) + r.slice(1).toLowerCase())
      .join(', ') || null;

  return (
    <div className="space-y-6">
      <Card
        variant="chart"
        className={cn(
          'transition-opacity duration-300',
          isRefetching && 'opacity-75'
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Summary
            </CardTitle>
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2 flex-wrap">
                  {dateRangeLabel && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-md">
                      {dateRangeLabel}
                      <button
                        onClick={() => {
                          setDateRange(null);
                        }}
                        className="hover:bg-muted-foreground/20 rounded p-0.5"
                        aria-label="Clear date range filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {roleLabels && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-md">
                      Roles: {roleLabels}
                      <button
                        onClick={() => {
                          setSelectedRoles([]);
                        }}
                        className="hover:bg-muted-foreground/20 rounded p-0.5"
                        aria-label="Clear role filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      reset();
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {/* Total Games */}
            <MetricCard
              title="Total Games"
              value={summary.totalGames}
              icon={Gamepad2}
              unit="games"
              variant="default"
            />

            {/* Total Wins */}
            <MetricCard
              title="Wins"
              value={summary.totalWins}
              icon={Trophy}
              unit="games"
              variant="positive"
            />

            {/* Total Losses */}
            <MetricCard
              title="Losses"
              value={summary.totalLosses}
              icon={XCircle}
              unit="games"
              variant="negative"
            />

            {/* Win Percentage */}
            <MetricCard
              title="Win Rate"
              value={summary.winPercentage}
              icon={TrendingUp}
              showPercentage
              variant={winPercentageVariant}
            />

            {/* Average Game Duration (if available) */}
            {summary.averageGameDuration !== undefined && (
              <MetricCard
                title="Avg Duration"
                value={summary.averageGameDuration}
                icon={Clock}
                unit="min"
                variant="neutral"
                description="Average game duration"
              />
            )}

            {/* Longest Win Streak */}
            <MetricCard
              title="Longest Win Streak"
              value={summary.longestWinStreak}
              icon={Award}
              unit="games"
              variant="positive"
            />

            {/* Best ELO Achieved */}
            <MetricCard
              title="Best ELO"
              value={summary.bestELOAchieved}
              icon={Trophy}
              variant="positive"
            />

            {/* Recent Activity - This Week */}
            <MetricCard
              title="Games This Week"
              value={summary.recentActivity.thisWeek}
              icon={Activity}
              unit="games"
              variant="default"
            />

            {/* Recent Activity - This Month */}
            <MetricCard
              title="Games This Month"
              value={summary.recentActivity.thisMonth}
              icon={Activity}
              unit="games"
              variant="default"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

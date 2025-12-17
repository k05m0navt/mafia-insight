/**
 * WinRateAnalysis - Component for displaying win rate analysis across roles
 *
 * Shows overall win rate prominently, per-role breakdown, bar chart comparing
 * win rates across roles, pie chart showing win/loss distribution, scenario-based
 * win rates (if available), and comparison to average (if available).
 */

'use client';

import React, { lazy, Suspense, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWinRateAnalysis } from '@/hooks/useWinRateAnalysis';
import { TimeRangeSelector } from './TimeRangeSelector';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalyticsStore } from '@/store/analyticsStore';
import type { WinRateAnalysisProps } from '@/types/analytics';
import type { PlayerRole } from '@prisma/client';

// Lazy load chart components for code splitting
const BarChartContent = lazy(() =>
  import('./WinRateBarChartContent').then((mod) => ({
    default: mod.ChartContent,
  }))
);

const PieChartContent = lazy(() =>
  import('./WinLossPieChartContent').then((mod) => ({
    default: mod.ChartContent,
  }))
);

/**
 * Role color mapping for display
 */
const roleColors: Record<PlayerRole, string> = {
  DON: '#8b5cf6', // Purple
  MAFIA: '#ef4444', // Red
  SHERIFF: '#3b82f6', // Blue
  CITIZEN: '#10b981', // Green
};

/**
 * Loading skeleton for win rate analysis
 */
function WinRateAnalysisSkeleton() {
  return (
    <Card variant="chart">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall win rate skeleton */}
          <Skeleton className="h-24 w-full" />
          {/* Charts skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main WinRateAnalysis Component
 */
export function WinRateAnalysis({
  playerId,
  dateRange: propDateRange,
  roles: propRoles,
}: WinRateAnalysisProps) {
  // Get filters from Zustand store, fallback to props or default
  const {
    dateRange: storeDateRange,
    selectedRoles: storeRoles,
    setDateRange,
  } = useAnalyticsStore();

  const effectiveDateRange = storeDateRange ||
    propDateRange || { preset: 'last_month' };
  const effectiveRoles = storeRoles.length > 0 ? storeRoles : propRoles;

  // Initialize store with default if not set
  useEffect(() => {
    if (!storeDateRange && !propDateRange) {
      setDateRange({ preset: 'last_month' });
    }
  }, [storeDateRange, propDateRange, setDateRange]);

  const { data, isLoading, error } = useWinRateAnalysis(
    playerId,
    effectiveDateRange || undefined,
    effectiveRoles
  );

  // Loading state
  if (isLoading) {
    return <WinRateAnalysisSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card variant="outlined" className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Failed to load win rate analysis: {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state - defensive check with optional chaining
  if (!data || !data.winLossCounts || data.winLossCounts.overall.total === 0) {
    return (
      <Card variant="chart">
        <CardHeader>
          <CardTitle>Win Rate Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              No win rate data available
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Import game data or select a different time range to view win rate
              analysis.
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

  const { overall, byRole, byScenario, comparisonToAverage, winLossCounts } =
    data;
  const allRoles: PlayerRole[] = ['DON', 'MAFIA', 'SHERIFF', 'CITIZEN'];

  return (
    <Card variant="chart" className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Win Rate Analysis</CardTitle>
          <TimeRangeSelector
            value={effectiveDateRange}
            onChange={setDateRange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Win Rate Display */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Overall Win Rate
              </p>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold">{overall.toFixed(1)}%</p>
                {comparisonToAverage !== undefined && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'flex items-center gap-1 text-sm',
                      comparisonToAverage >= 0
                        ? 'text-green-600 border-green-600'
                        : 'text-red-600 border-red-600'
                    )}
                  >
                    {comparisonToAverage >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {comparisonToAverage >= 0 ? '+' : ''}
                    {comparisonToAverage.toFixed(1)}% vs average
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {winLossCounts.overall.wins} wins,{' '}
                {winLossCounts.overall.losses} losses (
                {winLossCounts.overall.total} total games)
              </p>
            </div>
          </div>

          {/* Per-Role Win Rate Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Win Rate by Role</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allRoles.map((role) => {
                const winRate = byRole[role] || 0;
                const counts = winLossCounts.byRole[role] || {
                  wins: 0,
                  losses: 0,
                  total: 0,
                };

                return (
                  <Card key={role} variant="outlined" className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: roleColors[role] }}
                        />
                        <p className="font-semibold text-sm">{role}</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {winRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {counts.wins}W / {counts.losses}L ({counts.total} games)
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Win Rate by Role</h3>
              </div>
              <div className="h-64 w-full">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-muted-foreground">
                        Loading chart...
                      </div>
                    </div>
                  }
                >
                  <BarChartContent data={byRole} roles={allRoles} />
                </Suspense>
              </div>
            </div>

            {/* Pie Chart */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Win/Loss Distribution</h3>
              </div>
              <div className="h-64 w-full">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-muted-foreground">
                        Loading chart...
                      </div>
                    </div>
                  }
                >
                  <PieChartContent
                    wins={winLossCounts.overall.wins}
                    losses={winLossCounts.overall.losses}
                  />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Scenario-Based Win Rates (if available) */}
          {byScenario && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Win Rate by Scenario
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(byScenario).map(([scenario, winRate]) => (
                  <Card key={scenario} variant="outlined" className="p-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-sm capitalize">
                        {scenario}
                      </p>
                      <p className="text-2xl font-bold">
                        {winRate.toFixed(1)}%
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

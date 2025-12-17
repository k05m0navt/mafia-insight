/**
 * RoleComparisonChart - Component for displaying role comparison chart
 *
 * Shows a bar chart comparing performance metrics across different roles.
 * Optimized with useMemo for performance.
 * Chart library is lazy loaded for better code splitting.
 */

'use client';

import React, { useMemo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import type { RoleComparisonChartProps } from '@/types/analytics';
import type { RoleMetrics } from '@/types/analytics';

// Lazy load chart component for code splitting
const ChartContent = lazy(() =>
  import('./RoleComparisonChartContent').then((mod) => ({
    default: mod.ChartContent,
  }))
);

/**
 * Role colors for chart bars
 */
const roleColors: Record<string, string> = {
  DON: '#9333ea', // purple-600
  MAFIA: '#000000', // black
  SHERIFF: '#facc15', // yellow-400
  CITIZEN: '#ef4444', // red-500
};

/**
 * Dark mode role colors
 */
const roleColorsDark: Record<string, string> = {
  DON: '#a855f7', // purple-500
  MAFIA: '#374151', // gray-700
  SHERIFF: '#fbbf24', // yellow-500
  CITIZEN: '#f87171', // red-400
};

/**
 * Find the best performing role based on win rate
 */
function findBestPerformingRole(metrics: RoleMetrics[]): RoleMetrics | null {
  const rolesWithData = metrics.filter((m) => m.gamesPlayed > 0);
  if (rolesWithData.length === 0) return null;

  return rolesWithData.reduce((best, current) => {
    return current.winRate > best.winRate ? current : best;
  });
}

/**
 * Format data for chart display
 */
function formatChartData(metrics: RoleMetrics[]) {
  return metrics.map((m) => ({
    role: m.role,
    winRate: m.winRate,
    gamesPlayed: m.gamesPlayed,
    averageELO: m.averageELO,
  }));
}

/**
 * RoleComparisonChart Component
 */
export function RoleComparisonChart({
  roleMetrics,
  highlightBest = true,
}: RoleComparisonChartProps) {
  // Filter out roles with no data
  const metricsWithData = roleMetrics.filter((m) => m.gamesPlayed > 0);

  // Find best performing role
  const bestRole = useMemo(
    () => (highlightBest ? findBestPerformingRole(roleMetrics) : null),
    [roleMetrics, highlightBest]
  );

  // Format data for chart
  const chartData = useMemo(
    () => formatChartData(metricsWithData),
    [metricsWithData]
  );

  // If no data, show empty state
  if (metricsWithData.length === 0) {
    return (
      <Card variant="chart">
        <CardHeader>
          <CardTitle>Role Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No data available for comparison</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detect dark mode (simplified - could use a theme hook)
  const isDark =
    typeof window !== 'undefined' &&
    document.documentElement.classList.contains('dark');
  const colors = isDark ? roleColorsDark : roleColors;

  return (
    <Card variant="chart" className="transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Role Comparison</span>
          {bestRole && highlightBest && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-yellow-500" />
              Best: {bestRole.role}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading chart...</div>
            </div>
          }
        >
          <ChartContent
            chartData={chartData}
            colors={colors}
            bestRole={bestRole}
            highlightBest={highlightBest}
          />
        </Suspense>
      </CardContent>
    </Card>
  );
}

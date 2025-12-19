/**
 * RoleComparison - Component for displaying role comparison
 *
 * Shows side-by-side comparison of performance metrics across different roles
 * with comparison table/cards, metric selection, best role highlighting,
 * tooltips, and responsive layout.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Trophy, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoleComparison } from '@/hooks/useRoleComparison';
import { RoleComparisonChart } from './RoleComparisonChart';
import { useAnalyticsStore } from '@/store/analyticsStore';
import type { RoleComparisonProps, PlayerRole } from '@/types/analytics';

/**
 * Metric type for display
 */
type MetricType = 'winRate' | 'gamesPlayed' | 'averageELO' | 'winStreak';

/**
 * Loading skeleton for role comparison
 */
function RoleComparisonSkeleton() {
  return (
    <Card variant="chart">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} variant="outlined">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full mt-6" />
      </CardContent>
    </Card>
  );
}

/**
 * Role metric card component
 */
function RoleMetricCard({
  role,
  winRate,
  gamesPlayed,
  averageELO,
  winStreak,
  isBest,
  onHover,
}: {
  role: PlayerRole;
  winRate: number;
  gamesPlayed: number;
  averageELO: number;
  winStreak: number;
  isBest: boolean;
  onHover: (role: PlayerRole | null) => void;
}) {
  return (
    <Card
      variant={isBest ? 'elevated' : 'outlined'}
      className={cn(
        'transition-all duration-300 hover:shadow-md',
        isBest && 'ring-2 ring-primary ring-offset-2'
      )}
      onMouseEnter={() => onHover(role)}
      onMouseLeave={() => onHover(null)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{role}</CardTitle>
          {isBest && (
            <Badge
              variant="default"
              className="flex items-center gap-1 text-xs"
            >
              <Trophy className="h-3 w-3" />
              Best
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Win Rate</span>
            <span className="text-lg font-bold">{winRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Games Played</span>
            <span className="text-base font-semibold">{gamesPlayed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Avg ELO</span>
            <span className="text-base font-semibold">
              {Math.round(averageELO)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Win Streak</span>
            <span className="text-base font-semibold flex items-center gap-1">
              {winStreak > 0 && (
                <TrendingUp className="h-3 w-3 text-green-600" />
              )}
              {winStreak}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * RoleComparison Component
 */
export function RoleComparison({
  playerId,
  dateRange: propDateRange,
}: RoleComparisonProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<Set<MetricType>>(
    new Set(['winRate', 'gamesPlayed', 'averageELO', 'winStreak'])
  );
  const [_hoveredRole, setHoveredRole] = useState<PlayerRole | null>(null);

  // Get filters from Zustand store, fallback to prop or default
  const { dateRange: storeDateRange, roles: storeRoles } = useAnalyticsStore();
  const effectiveDateRange = storeDateRange || propDateRange || null;
  const effectiveRoles = storeRoles.length > 0 ? storeRoles : undefined;

  const { data, isLoading, error } = useRoleComparison(
    playerId,
    effectiveDateRange || undefined,
    effectiveRoles
  );

  // Toggle metric selection
  const toggleMetric = (metric: MetricType) => {
    setSelectedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(metric)) {
        next.delete(metric);
      } else {
        next.add(metric);
      }
      return next;
    });
  };

  // Filter roles based on selected metrics (for display purposes)
  const displayRoles = useMemo(() => {
    if (!data) return [];
    return data.roles;
  }, [data]);

  // Loading state
  if (isLoading) {
    return <RoleComparisonSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card variant="outlined" className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Failed to load role comparison: {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state - insufficient data (< 2 roles)
  if (!data || data.roles.length < 2) {
    return (
      <Card variant="chart">
        <CardHeader>
          <CardTitle>Role Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Insufficient data for comparison
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              You need performance data for at least 2 different roles to
              compare. Try importing more game data or adjusting your filters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comparison Cards */}
      <Card variant="chart">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Role Comparison</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={selectedMetrics.has('winRate') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleMetric('winRate')}
                className="text-xs"
              >
                Win Rate
              </Button>
              <Button
                variant={
                  selectedMetrics.has('gamesPlayed') ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => toggleMetric('gamesPlayed')}
                className="text-xs"
              >
                Games
              </Button>
              <Button
                variant={
                  selectedMetrics.has('averageELO') ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => toggleMetric('averageELO')}
                className="text-xs"
              >
                ELO
              </Button>
              <Button
                variant={
                  selectedMetrics.has('winStreak') ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => toggleMetric('winStreak')}
                className="text-xs"
              >
                Streak
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {displayRoles.map((roleMetric, index) => (
                <motion.div
                  key={roleMetric.role}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <RoleMetricCard
                    role={roleMetric.role}
                    winRate={roleMetric.winRate}
                    gamesPlayed={roleMetric.gamesPlayed}
                    averageELO={roleMetric.averageELO}
                    winStreak={roleMetric.winStreak}
                    isBest={roleMetric.role === data.bestPerformingRole}
                    onHover={setHoveredRole}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <RoleComparisonChart comparison={data} highlightBest={true} />
      </motion.div>
    </div>
  );
}

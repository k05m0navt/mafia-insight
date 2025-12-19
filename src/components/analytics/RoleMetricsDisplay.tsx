/**
 * RoleMetricsDisplay - Component for displaying role-based performance metrics
 *
 * Displays four role cards (Don, Mafia, Sheriff, Citizen) with win rate,
 * games played, and average ELO for each role.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRoleBasedAnalytics } from '@/hooks/useRoleBasedAnalytics';
import { useAnalyticsStore } from '@/store/analyticsStore';
import type { RoleMetricsDisplayProps } from '@/types/analytics';
import type { RoleMetrics, PerformanceLevel } from '@/types/analytics';
import { Trophy, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Role type to role card variant mapping
 */
const roleTypeMap: Record<string, 'don' | 'mafia' | 'sheriff' | 'citizen'> = {
  DON: 'don',
  MAFIA: 'mafia',
  SHERIFF: 'sheriff',
  CITIZEN: 'citizen',
};

/**
 * Performance level icons and colors
 */
const performanceIcons: Record<
  PerformanceLevel,
  { icon: typeof Trophy; color: string }
> = {
  excellent: { icon: Trophy, color: 'text-green-600 dark:text-green-400' },
  good: { icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400' },
  needs_improvement: {
    icon: TrendingDown,
    color: 'text-orange-600 dark:text-orange-400',
  },
};

/**
 * Get performance level display info
 */
function getPerformanceDisplay(level: PerformanceLevel) {
  const { icon: Icon, color } = performanceIcons[level];
  const label =
    level === 'excellent'
      ? 'Excellent'
      : level === 'good'
        ? 'Good'
        : 'Needs Improvement';

  return { Icon, color, label };
}

/**
 * Role Card Component - displays metrics for a single role
 */
function RoleCard({ metrics }: { metrics: RoleMetrics }) {
  const { Icon, color, label } = getPerformanceDisplay(
    metrics.performanceLevel
  );
  const roleType = roleTypeMap[metrics.role] || 'don';
  const hasData = metrics.gamesPlayed > 0;

  return (
    <Card
      variant="role"
      roleType={roleType}
      className="transition-all duration-300 hover:shadow-lg"
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-bold">{metrics.role}</span>
          {hasData && (
            <Badge variant="outline" className="text-xs">
              <Icon className={`h-3 w-3 mr-1 ${color}`} />
              {label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                <p className="text-2xl font-bold">
                  {metrics.winRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Games Played
                </p>
                <p className="text-2xl font-bold">{metrics.gamesPlayed}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Average ELO
                </p>
                <p className="text-xl font-semibold">
                  {metrics.averageELO.toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Wins / Losses
                </p>
                <p className="text-xl font-semibold">
                  {metrics.wins} / {metrics.losses}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in duration-300">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No data available for this role
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for role cards
 */
function RoleCardSkeleton() {
  return (
    <Card variant="default" className="animate-pulse">
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main RoleMetricsDisplay Component
 */
export function RoleMetricsDisplay({
  playerId,
  dateRange: propDateRange,
  roles: propRoles,
}: RoleMetricsDisplayProps) {
  // Get filters from Zustand store, fallback to props or null (all time)
  const { dateRange: storeDateRange, roles: storeRoles } = useAnalyticsStore();

  const effectiveDateRange = storeDateRange || propDateRange || null;
  const effectiveRoles = storeRoles.length > 0 ? storeRoles : propRoles;

  const { data, isLoading, error } = useRoleBasedAnalytics(
    playerId,
    effectiveDateRange || undefined,
    effectiveRoles
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <RoleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="outlined" className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Failed to load role metrics: {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render role cards
  const roleMetrics = data?.roleMetrics || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {roleMetrics.map((metrics) => (
        <RoleCard key={metrics.role} metrics={metrics} />
      ))}
    </div>
  );
}

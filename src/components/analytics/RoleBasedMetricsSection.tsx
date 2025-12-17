/**
 * RoleBasedMetricsSection - Wrapper component that integrates RoleMetricsDisplay
 * and RoleComparisonChart with filter state management
 */

'use client';

import React from 'react';
import { RoleMetricsDisplay } from './RoleMetricsDisplay';
import { RoleComparisonChart } from './RoleComparisonChart';
import { AnalyticsErrorBoundary } from './ErrorBoundary';
import { useRoleBasedAnalytics } from '@/hooks/useRoleBasedAnalytics';
import { useAnalyticsStore } from '@/store/analyticsStore';

export interface RoleBasedMetricsSectionProps {
  playerId: string;
  className?: string;
}

/**
 * Section component that displays role-based metrics with comparison chart
 * Integrates with analytics store for filter state management
 */
export function RoleBasedMetricsSection({
  playerId,
  className = '',
}: RoleBasedMetricsSectionProps) {
  // Get filter state from store
  const { dateRange, selectedRoles } = useAnalyticsStore();

  // Fetch role-based analytics with filters
  const { data } = useRoleBasedAnalytics(
    playerId,
    dateRange || undefined,
    selectedRoles.length > 0 ? selectedRoles : undefined
  );

  return (
    <AnalyticsErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Role Metrics Display */}
        <div>
          <RoleMetricsDisplay
            playerId={playerId}
            dateRange={dateRange || undefined}
            roles={selectedRoles.length > 0 ? selectedRoles : undefined}
          />
        </div>

        {/* Role Comparison Chart */}
        {data?.roleMetrics && data.roleMetrics.length > 0 && (
          <div className="transition-all duration-300">
            <RoleComparisonChart
              roleMetrics={data.roleMetrics}
              highlightBest={true}
            />
          </div>
        )}
      </div>
    </AnalyticsErrorBoundary>
  );
}

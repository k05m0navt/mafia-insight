/**
 * Analytics types for role-based performance metrics and analytics features
 */

/**
 * Player role types
 */
export type PlayerRole = 'DON' | 'MAFIA' | 'SHERIFF' | 'CITIZEN';

/**
 * Performance level indicators
 */
export type PerformanceLevel = 'excellent' | 'good' | 'needs_improvement';

/**
 * Date range for filtering analytics
 */
export interface DateRange {
  startDate?: string | null;
  endDate?: string | null;
  preset?:
    | 'last_week'
    | 'last_month'
    | 'last_3_months'
    | 'last_year'
    | 'all_time'
    | null;
}

/**
 * Role-based metrics for a single role
 */
export interface RoleMetrics {
  role: PlayerRole;
  winRate: number; // percentage (0-100)
  gamesPlayed: number;
  wins: number;
  losses: number;
  averageELO: number;
  performanceLevel: PerformanceLevel;
}

/**
 * Request parameters for role-based analytics API
 */
export interface RoleBasedAnalyticsRequest {
  playerId: string;
  dateRange?: DateRange;
  roles?: PlayerRole[];
}

/**
 * Response for role-based analytics API
 */
export interface RoleBasedAnalyticsResponse {
  roleMetrics: RoleMetrics[];
}

/**
 * Props for RoleMetricsDisplay component
 */
export interface RoleMetricsDisplayProps {
  playerId: string;
  dateRange?: DateRange;
  roles?: PlayerRole[];
}

/**
 * Props for RoleComparisonChart component
 */
export interface RoleComparisonChartProps {
  roleMetrics: RoleMetrics[];
  highlightBest?: boolean;
}

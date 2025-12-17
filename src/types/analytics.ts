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
  preset?: 'last_month' | 'last_3_months' | 'last_6_months' | 'all_time' | null;
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

/**
 * ELO trend data point
 */
export interface ELOTrendPoint {
  date: string; // ISO 8601 date string
  elo: number;
  gameId: string;
}

/**
 * Period for aggregating ELO trends
 */
export type ELOTrendPeriod = 'day' | 'week' | 'month';

/**
 * Response for ELO trends API
 */
export interface ELOTrendsResponse {
  trends: ELOTrendPoint[];
  currentELO: number;
  historicalHigh: number;
  historicalLow: number;
}

/**
 * Props for ELOTrendsChart component
 */
export interface ELOTrendsChartProps {
  playerId: string;
  dateRange?: DateRange;
  period?: ELOTrendPeriod;
}

/**
 * Props for TimeRangeSelector component
 */
export interface TimeRangeSelectorProps {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  presets?: Array<
    'last_month' | 'last_3_months' | 'last_6_months' | 'all_time'
  >;
}

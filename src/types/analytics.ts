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
 * Date range preset options for quick date range selection
 * - last_week: Last 7 days
 * - last_month: Last 30 days
 * - last_3_months: Last 90 days
 * - last_year: Last 365 days
 * - all_time: No date filtering (all available data)
 */
export type DateRangePreset =
  | 'last_week'
  | 'last_month'
  | 'last_3_months'
  | 'last_year'
  | 'all_time';

/**
 * Date range for filtering analytics data
 * Can be either a preset (quick selection) or custom date range
 */
export interface DateRange {
  /** Start date in ISO 8601 format (required for custom ranges) */
  startDate?: string | null;
  /** End date in ISO 8601 format (required for custom ranges) */
  endDate?: string | null;
  /** Preset option (mutually exclusive with custom startDate/endDate) */
  preset?: DateRangePreset | null;
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

/**
 * Win rate analysis data model
 */
export interface WinRateAnalysis {
  overall: number; // percentage (0-100)
  byRole: Record<string, number>; // role -> win rate percentage
  byScenario?: Record<string, number>; // scenario -> win rate (if available)
  comparisonToAverage?: number; // difference from average (if available)
  winLossCounts: {
    overall: {
      wins: number;
      losses: number;
      total: number;
    };
    byRole: Record<
      string,
      {
        wins: number;
        losses: number;
        total: number;
      }
    >;
  };
}

/**
 * Response for win rate analysis API
 */
export type WinRateAnalysisResponse = WinRateAnalysis;

/**
 * Props for WinRateAnalysis component
 */
export interface WinRateAnalysisProps {
  playerId: string;
  dateRange?: DateRange;
  roles?: PlayerRole[];
}

/**
 * Performance summary data model
 */
export interface PerformanceSummary {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winPercentage: number;
  averageGameDuration?: number; // minutes (if available)
  longestWinStreak: number;
  bestELOAchieved: number;
  recentActivity: {
    thisWeek: number;
    thisMonth: number;
  };
}

/**
 * Response for performance summary API
 */
export type PerformanceSummaryResponse = PerformanceSummary;

/**
 * Props for PerformanceSummary component
 */
export interface PerformanceSummaryProps {
  playerId: string;
  dateRange?: DateRange;
  roles?: PlayerRole[];
}

/**
 * Period for aggregating performance trends
 */
export type TrendPeriod = 'week' | 'month' | 'quarter';

/**
 * Performance trend data point for a specific period
 */
export interface PerformanceTrend {
  /** Period identifier (e.g., 'week', 'month', 'quarter') */
  period: TrendPeriod;
  /** Start date of the period (ISO 8601 format) */
  startDate: string;
  /** End date of the period (ISO 8601 format) */
  endDate: string;
  /** Metrics for this period */
  metrics: {
    /** Win rate percentage (0-100) */
    winRate: number;
    /** Average ELO rating for the period */
    elo: number;
    /** Number of games played in the period */
    gamesPlayed: number;
  };
  /** Trend direction indicator */
  trend: 'up' | 'down' | 'stable';
  /** Percentage change from previous period (can be positive or negative) */
  changeFromPrevious: number;
}

/**
 * Comparison between current and previous period
 */
export interface TrendComparison {
  /** Current period metrics */
  currentPeriod: PerformanceTrend;
  /** Previous period metrics */
  previousPeriod: PerformanceTrend;
  /** Percentage changes for each metric */
  change: {
    /** Win rate change percentage */
    winRate: number;
    /** ELO change (absolute, not percentage) */
    elo: number;
    /** Games played change percentage */
    gamesPlayed: number;
  };
}

/**
 * Response for performance trends API
 */
export interface PerformanceTrendsResponse {
  /** Array of performance trends grouped by period */
  trends: PerformanceTrend[];
  /** Comparison between current and previous period */
  comparison?: TrendComparison;
}

/**
 * Props for TrendsChart component
 */
export interface TrendsChartProps {
  playerId: string;
  dateRange?: DateRange;
  period?: TrendPeriod;
}

/**
 * Metrics for a single role in comparison view
 */
export interface RoleComparisonMetrics {
  role: PlayerRole;
  winRate: number; // percentage (0-100)
  gamesPlayed: number;
  averageELO: number;
  winStreak: number; // current consecutive wins
}

/**
 * Role comparison data structure
 */
export interface RoleComparison {
  /** Array of role metrics for comparison */
  roles: RoleComparisonMetrics[];
  /** Best-performing role based on win rate and ELO */
  bestPerformingRole: PlayerRole;
  /** Aggregated metrics by role for chart display */
  metrics: {
    winRate: Record<string, number>; // role -> win rate percentage
    gamesPlayed: Record<string, number>; // role -> games played count
    averageELO: Record<string, number>; // role -> average ELO
    winStreak: Record<string, number>; // role -> win streak
  };
}

/**
 * Response for role comparison API
 */
export interface RoleComparisonResponse {
  roles: RoleComparisonMetrics[];
  bestPerformingRole: PlayerRole;
  metrics: {
    winRate: Record<string, number>;
    gamesPlayed: Record<string, number>;
    averageELO: Record<string, number>;
    winStreak: Record<string, number>;
  };
}

/**
 * Props for RoleComparison component
 */
export interface RoleComparisonProps {
  playerId: string;
  dateRange?: DateRange;
}

/**
 * Props for RoleComparisonChart component
 */
export interface RoleComparisonChartProps {
  /** Role comparison data */
  comparison: RoleComparison;
  /** Whether to highlight best-performing role */
  highlightBest?: boolean;
}

/**
 * Validation schemas for ELO trends API endpoints
 */

import { z } from 'zod';

/**
 * ELO trend period validation
 */
export const ELOTrendPeriodSchema = z.enum(['day', 'week', 'month']);

/**
 * Date range preset validation for ELO trends
 */
export const ELOTrendsDateRangePresetSchema = z.enum([
  'last_month',
  'last_3_months',
  'last_6_months',
  'all_time',
]);

/**
 * Date range validation schema for ELO trends
 */
export const ELOTrendsDateRangeSchema = z
  .object({
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    preset: ELOTrendsDateRangePresetSchema.optional().nullable(),
  })
  .optional();

/**
 * Query parameters for ELO trends endpoint
 */
export const ELOTrendsQuerySchema = z.object({
  dateRange: ELOTrendsDateRangeSchema,
  period: ELOTrendPeriodSchema.optional(),
});

/**
 * Player ID parameter validation (reuse from roleMetricsSchemas)
 */
export { PlayerIdParamSchema } from './roleMetricsSchemas';

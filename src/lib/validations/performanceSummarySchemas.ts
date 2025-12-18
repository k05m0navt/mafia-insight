/**
 * Validation schemas for performance summary API endpoints
 */

import { z } from 'zod';

/**
 * Player ID parameter validation (reuse from roleMetricsSchemas)
 */
export { PlayerIdParamSchema } from './roleMetricsSchemas';

/**
 * Date range schema for query parameters
 */
export const DateRangeSchema = z
  .object({
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
    preset: z
      .enum([
        'last_week',
        'last_month',
        'last_3_months',
        'last_year',
        'all_time',
      ])
      .nullable()
      .optional(),
  })
  .optional();

/**
 * Performance summary query schema
 */
export const PerformanceSummaryQuerySchema = z.object({
  dateRange: DateRangeSchema,
  roles: z.array(z.enum(['DON', 'MAFIA', 'SHERIFF', 'CITIZEN'])).optional(),
});

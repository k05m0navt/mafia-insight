/**
 * Validation schemas for performance trends API endpoints
 */

import { z } from 'zod';

/**
 * Trend period validation (week, month, quarter)
 */
export const TrendPeriodSchema = z.enum(['week', 'month', 'quarter']);

/**
 * Date range preset validation for trends
 * Supports all standard presets: last_week, last_month, last_3_months, last_year, all_time
 */
export const TrendsDateRangePresetSchema = z.enum([
  'last_week',
  'last_month',
  'last_3_months',
  'last_year',
  'all_time',
]);

/**
 * Date range validation schema for trends
 */
export const TrendsDateRangeSchema = z
  .object({
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    preset: TrendsDateRangePresetSchema.optional().nullable(),
  })
  .optional();

/**
 * Player role validation (reuse from roleMetricsSchemas)
 */
export { PlayerRoleSchema } from './roleMetricsSchemas';

/**
 * Query parameters for trends endpoint
 */
export const TrendsQuerySchema = z.object({
  dateRange: TrendsDateRangeSchema,
  period: TrendPeriodSchema.optional(),
  roles: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const roles = val.split(',').map((r) => r.trim().toUpperCase());
      // Validate each role
      const validRoles = roles.filter((r) =>
        ['DON', 'MAFIA', 'SHERIFF', 'CITIZEN'].includes(r)
      ) as Array<'DON' | 'MAFIA' | 'SHERIFF' | 'CITIZEN'>;
      return validRoles.length > 0 ? validRoles : undefined;
    }),
});

/**
 * Player ID parameter validation (reuse from roleMetricsSchemas)
 */
export { PlayerIdParamSchema } from './roleMetricsSchemas';

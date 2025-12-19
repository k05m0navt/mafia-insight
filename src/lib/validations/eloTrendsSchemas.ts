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
 * Supports all standard presets: last_week, last_month, last_3_months, last_year, all_time
 */
export const ELOTrendsDateRangePresetSchema = z.enum([
  'last_week',
  'last_month',
  'last_3_months',
  'last_year',
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
 * Player role validation (reuse from roleMetricsSchemas)
 */
export { PlayerRoleSchema } from './roleMetricsSchemas';

/**
 * Query parameters for ELO trends endpoint
 */
export const ELOTrendsQuerySchema = z.object({
  dateRange: ELOTrendsDateRangeSchema,
  period: ELOTrendPeriodSchema.optional(),
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

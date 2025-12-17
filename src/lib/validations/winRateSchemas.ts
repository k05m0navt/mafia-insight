/**
 * Validation schemas for win rate analysis API endpoints
 */

import { z } from 'zod';

/**
 * Date range preset validation for win rates
 */
export const WinRateDateRangePresetSchema = z.enum([
  'last_month',
  'last_3_months',
  'last_6_months',
  'all_time',
]);

/**
 * Date range validation schema for win rates
 */
export const WinRateDateRangeSchema = z
  .object({
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    preset: WinRateDateRangePresetSchema.optional().nullable(),
  })
  .optional();

/**
 * Player role validation
 */
export const PlayerRoleSchema = z.enum(['DON', 'MAFIA', 'SHERIFF', 'CITIZEN']);

/**
 * Query parameters for win rates endpoint
 */
export const WinRateQuerySchema = z.object({
  dateRange: WinRateDateRangeSchema,
  roles: z.array(PlayerRoleSchema).optional(),
});

/**
 * Player ID parameter validation (reuse from roleMetricsSchemas)
 */
export { PlayerIdParamSchema } from './roleMetricsSchemas';

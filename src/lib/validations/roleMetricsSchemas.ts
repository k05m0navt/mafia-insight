/**
 * Validation schemas for role-based analytics API endpoints
 */

import { z } from 'zod';

/**
 * Player role enum validation
 */
export const PlayerRoleSchema = z.enum(['DON', 'MAFIA', 'SHERIFF', 'CITIZEN']);

/**
 * Date range preset validation
 */
export const DateRangePresetSchema = z.enum([
  'last_week',
  'last_month',
  'last_3_months',
  'last_year',
  'all_time',
]);

/**
 * Date range validation schema
 */
export const DateRangeSchema = z
  .object({
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    preset: DateRangePresetSchema.optional().nullable(),
  })
  .optional();

/**
 * Query parameters for role-based analytics endpoint
 */
export const RoleBasedAnalyticsQuerySchema = z.object({
  // Date range can be provided as preset or as startDate/endDate
  dateRange: DateRangeSchema,
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
 * Player ID parameter validation
 */
export const PlayerIdParamSchema = z.object({
  id: z.string().uuid('Invalid player ID format'),
});

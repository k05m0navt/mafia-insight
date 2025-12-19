/**
 * Validation schemas for analytics API endpoints
 */

import { z } from 'zod';
import { DateRangeSchema } from './roleMetricsSchemas';

/**
 * Query parameters for role comparison endpoint
 */
export const RoleComparisonQuerySchema = z.object({
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
 * Re-export PlayerIdParamSchema for convenience
 */
export { PlayerIdParamSchema } from './roleMetricsSchemas';

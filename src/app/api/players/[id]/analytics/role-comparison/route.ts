/**
 * GET /api/players/[id]/analytics/role-comparison
 * Get role comparison data for a player
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, requireRole } from '@/lib/apiAuth';
import {
  ApplicationNotFoundError,
  ApplicationValidationError,
} from '@/application/errors';
import { RoleComparisonRepository } from '@/infrastructure/persistence/role-comparison.repository';
import { GetRoleComparisonUseCase } from '@/application/use-cases/get-role-comparison.use-case';
import {
  PlayerIdParamSchema,
  RoleComparisonQuerySchema,
} from '@/lib/validations/analyticsSchemas';
import type { DateRangePreset } from '@/types/analytics';
import { calculatePresetDateRange } from '@/lib/utils/dateRange';

const repository = new RoleComparisonRepository();
const useCase = new GetRoleComparisonUseCase(repository);

/**
 * Helper function to verify player ownership or admin access
 */
async function verifyPlayerAccess(
  playerId: string,
  userId: string,
  userRole: string
): Promise<void> {
  // Admins can access any player's data
  if (userRole.toLowerCase() === 'admin') {
    const playerExists = await repository.verifyPlayerAccess(playerId);
    if (!playerExists) {
      throw new ApplicationNotFoundError('Player not found');
    }
    return;
  }

  // Regular users can only access their own players
  const hasAccess = await repository.verifyPlayerAccess(playerId, userId);
  if (!hasAccess) {
    throw new ApplicationNotFoundError('Player not found');
  }
}

/**
 * Type guard to check if a string is a valid DateRangePreset (excluding 'all_time')
 */
function isSupportedPreset(
  preset: string
): preset is Exclude<DateRangePreset, 'all_time'> {
  const supportedPresets: readonly Exclude<DateRangePreset, 'all_time'>[] = [
    'last_week',
    'last_month',
    'last_3_months',
    'last_year',
  ];
  return supportedPresets.includes(
    preset as Exclude<DateRangePreset, 'all_time'>
  );
}

/**
 * Convert date range preset to actual date range using utility function
 */
function convertPresetToDateRange(
  preset: string
): { startDate: string; endDate: string } | null {
  if (preset === 'all_time') {
    return null; // No date filtering
  }

  // Use utility function for supported presets
  if (isSupportedPreset(preset)) {
    const result = calculatePresetDateRange(preset);
    // If result has empty strings, it means all_time
    if (!result.startDate || !result.endDate) {
      return null;
    }
    return result;
  }

  return null;
}

/**
 * GET handler for role comparison
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request
    const { user, role } = await authenticateRequest(request);
    requireRole(role, 'user');

    // Parse and validate parameters
    const { id: playerId } = PlayerIdParamSchema.parse(await params);
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const dateRangeStart = searchParams.get('startDate');
    const dateRangeEnd = searchParams.get('endDate');
    const dateRangePreset = searchParams.get('dateRangePreset');
    const rolesParam = searchParams.get('roles');

    const queryParams: {
      dateRange?: {
        startDate?: string | null;
        endDate?: string | null;
        preset?: string | null;
      };
      roles?: string;
    } = {};

    // Only include dateRange if at least one date param is provided
    if (dateRangeStart || dateRangeEnd || dateRangePreset) {
      queryParams.dateRange = {
        startDate: dateRangeStart || null,
        endDate: dateRangeEnd || null,
        preset: dateRangePreset || null,
      };
    }

    if (rolesParam) {
      queryParams.roles = rolesParam;
    }

    // Parse with schema (allows optional params)
    const validatedQuery = RoleComparisonQuerySchema.parse(queryParams);

    // Verify player access (user must own the player or be admin)
    await verifyPlayerAccess(playerId, user.id, role);

    // Parse date range from query params or preset
    let dateRange = validatedQuery.dateRange;
    if (dateRange?.preset) {
      // Handle 'all_time' preset - no date filtering
      if (dateRange.preset === 'all_time') {
        dateRange = undefined;
      } else {
        // Convert preset to date range
        const converted = convertPresetToDateRange(dateRange.preset);
        if (converted) {
          dateRange = {
            startDate: converted.startDate,
            endDate: converted.endDate,
            preset: null,
          };
        } else {
          dateRange = undefined;
        }
      }
    }

    // Execute use case with performance measurement
    const startTime = performance.now();
    const response = await useCase.execute(
      playerId,
      dateRange,
      validatedQuery.roles
    );
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Log performance metrics (only in development or if duration exceeds threshold)
    if (process.env.NODE_ENV === 'development' || duration > 500) {
      console.log(
        `[Role Comparison API] Response time: ${duration.toFixed(2)}ms`,
        {
          playerId,
          dateRange: dateRange ? 'filtered' : 'all_time',
          roles: validatedQuery.roles || 'all',
        }
      );
    }

    // Add performance header for monitoring
    const headers = new Headers();
    headers.set('X-Response-Time', `${Math.round(duration)}ms`);

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error('Error fetching role comparison:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof ApplicationValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ApplicationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Handle authentication/authorization errors
    if (
      error instanceof Error &&
      (error.message.includes('Authentication required') ||
        error.message.includes('Role'))
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch role comparison',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/players/[id]/analytics/role-based
 * Get role-based performance metrics for a player
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, requireRole } from '@/lib/apiAuth';
import {
  ApplicationNotFoundError,
  ApplicationValidationError,
} from '@/application/errors';
import { RoleMetricsRepository } from '@/infrastructure/persistence/role-metrics.repository';
import { RoleMetricsCalculator } from '@/domain/services/role-metrics-calculator';
import {
  PlayerIdParamSchema,
  RoleBasedAnalyticsQuerySchema,
} from '@/lib/validations/roleMetricsSchemas';
import type { RoleBasedAnalyticsResponse } from '@/types/analytics';

const repository = new RoleMetricsRepository();
const calculator = new RoleMetricsCalculator();

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
 * GET handler for role-based analytics
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
    const validatedQuery = RoleBasedAnalyticsQuerySchema.parse(queryParams);

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
        const now = new Date();
        const preset = dateRange.preset;

        switch (preset) {
          case 'last_week': {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            dateRange = {
              startDate: weekAgo.toISOString(),
              endDate: now.toISOString(),
              preset: null,
            };
            break;
          }
          case 'last_month': {
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            dateRange = {
              startDate: monthAgo.toISOString(),
              endDate: now.toISOString(),
              preset: null,
            };
            break;
          }
          case 'last_3_months': {
            const threeMonthsAgo = new Date(now);
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            dateRange = {
              startDate: threeMonthsAgo.toISOString(),
              endDate: now.toISOString(),
              preset: null,
            };
            break;
          }
          case 'last_year': {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            dateRange = {
              startDate: yearAgo.toISOString(),
              endDate: now.toISOString(),
              preset: null,
            };
            break;
          }
        }
      }
    }

    // Fetch participation data from database
    const participationData = await repository.getRoleParticipationData(
      playerId,
      dateRange,
      validatedQuery.roles || undefined
    );

    // Calculate role metrics
    let roleMetrics = calculator.calculateRoleMetrics(participationData);

    // Filter by roles if specified
    if (validatedQuery.roles && validatedQuery.roles.length > 0) {
      roleMetrics = calculator.filterByRoles(roleMetrics, validatedQuery.roles);
    }

    const response: RoleBasedAnalyticsResponse = {
      roleMetrics,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching role-based analytics:', error);

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
        error: 'Failed to fetch role-based analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

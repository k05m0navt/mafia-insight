/**
 * GET /api/players/[id]/analytics/elo-trends
 * Get ELO trends with historical progression for a player
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, requireRole } from '@/lib/apiAuth';
import {
  ApplicationNotFoundError,
  ApplicationValidationError,
} from '@/application/errors';
import { ELOTrendsRepository } from '@/infrastructure/persistence/elo-trends.repository';
import { ELOTrendCalculator } from '@/domain/services/elo-trend-calculator';
import {
  PlayerIdParamSchema,
  ELOTrendsQuerySchema,
} from '@/lib/validations/eloTrendsSchemas';
import type { ELOTrendsResponse } from '@/types/analytics';

const repository = new ELOTrendsRepository();
const calculator = new ELOTrendCalculator();

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
 * Convert date range preset to actual date range
 */
function convertPresetToDateRange(
  preset: string
): { startDate: string; endDate: string } | null {
  const now = new Date();

  switch (preset) {
    case 'last_month': {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return {
        startDate: monthAgo.toISOString(),
        endDate: now.toISOString(),
      };
    }
    case 'last_3_months': {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return {
        startDate: threeMonthsAgo.toISOString(),
        endDate: now.toISOString(),
      };
    }
    case 'last_6_months': {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return {
        startDate: sixMonthsAgo.toISOString(),
        endDate: now.toISOString(),
      };
    }
    case 'all_time':
      return null; // No date filtering
    default:
      return null;
  }
}

/**
 * GET handler for ELO trends
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
    const periodParam = searchParams.get('period');

    const queryParams: {
      dateRange?: {
        startDate?: string | null;
        endDate?: string | null;
        preset?: string | null;
      };
      period?: string;
    } = {};

    // Only include dateRange if at least one date param is provided
    if (dateRangeStart || dateRangeEnd || dateRangePreset) {
      queryParams.dateRange = {
        startDate: dateRangeStart || null,
        endDate: dateRangeEnd || null,
        preset: dateRangePreset || null,
      };
    }

    if (periodParam) {
      queryParams.period = periodParam;
    }

    // Parse with schema (allows optional params)
    const validatedQuery = ELOTrendsQuerySchema.parse(queryParams);

    // Verify player access (user must own the player or be admin)
    await verifyPlayerAccess(playerId, user.id, role);

    // Get current ELO
    const currentELO = await repository.getCurrentELO(playerId);

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

    // Fetch raw ELO data from database
    const rawData = await repository.getELOTrendData(playerId, dateRange);

    // Calculate trends using domain service
    const period = validatedQuery.period || 'day';
    const trends = calculator.calculateTrends(rawData, currentELO, period);

    // Calculate current ELO (most recent or player's current)
    const calculatedCurrentELO = calculator.calculateCurrentELO(
      rawData,
      currentELO
    );

    // Calculate historical high/low
    const { high, low } = calculator.calculateHistoricalHighLow(
      trends,
      currentELO
    );

    const response: ELOTrendsResponse = {
      trends,
      currentELO: calculatedCurrentELO,
      historicalHigh: high,
      historicalLow: low,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching ELO trends:', error);

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
        error: 'Failed to fetch ELO trends',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { resilientDB } from '@/lib/db-resilient';
import { authenticateRequest } from '@/lib/apiAuth';
import { z } from 'zod';
import { checkApiRateLimit } from '@/lib/rateLimiter';

/**
 * Validates cron expression format
 * Supports standard 5-field cron expressions: minute hour day month weekday
 * Also accepts predefined values: "daily", "hourly"
 */
function validateCronExpression(value: string | null | undefined): boolean {
  if (!value) return true; // null/undefined is valid (optional field)

  // Allow predefined schedules
  if (value === 'daily' || value === 'hourly') {
    return true;
  }

  // Validate cron expression format (5 fields: minute hour day month weekday)
  const cronPattern =
    /^(\*|([0-9]|[1-5][0-9])|\*\/([0-9]|[1-5][0-9])|([0-9]|[1-5][0-9])-([0-9]|[1-5][0-9]))\s+(\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])|([0-9]|1[0-9]|2[0-3])-([0-9]|1[0-9]|2[0-3]))\s+(\*|([1-9]|[12][0-9]|3[01])|\*\/([1-9]|[12][0-9]|3[01])|([1-9]|[12][0-9]|3[01])-([1-9]|[12][0-9]|3[01]))\s+(\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])|([1-9]|1[0-2])-([1-9]|1[0-2]))\s+(\*|([0-6])|\*\/([0-6])|([0-6])-([0-6]))$/;

  return cronPattern.test(value);
}

const syncPreferencesSchema = z.object({
  syncEnabled: z.boolean(),
  syncSchedule: z
    .string()
    .optional()
    .nullable()
    .refine((val) => validateCronExpression(val), {
      message:
        'Invalid cron expression format. Must be a valid 5-field cron expression (e.g., "0 0 * * *") or predefined value ("daily", "hourly")',
    }),
});

/**
 * GET /api/settings/sync
 * Get sync preferences for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);

    const userData = await resilientDB.execute((db) =>
      db.user.findUnique({
        where: { id: user.id },
        select: {
          syncEnabled: true,
          syncSchedule: true,
          lastSyncAt: true,
        },
      })
    );

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      syncEnabled: userData.syncEnabled || false,
      syncSchedule: userData.syncSchedule || null,
      lastSyncAt: userData.lastSyncAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('[Sync Preferences API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/sync
 * Update sync preferences for authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);

    // Apply rate limiting (10 requests per minute per user)
    const rateLimitResult = await checkApiRateLimit(
      `sync-preferences:${user.id}`
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const validatedData = syncPreferencesSchema.parse(body);

    const updatedUser = await resilientDB.execute((db) =>
      db.user.update({
        where: { id: user.id },
        data: {
          syncEnabled: validatedData.syncEnabled,
          syncSchedule: validatedData.syncSchedule || null,
        },
        select: {
          syncEnabled: true,
          syncSchedule: true,
          lastSyncAt: true,
        },
      })
    );

    return NextResponse.json({
      success: true,
      syncEnabled: updatedUser.syncEnabled,
      syncSchedule: updatedUser.syncSchedule,
      lastSyncAt: updatedUser.lastSyncAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('[Sync Preferences API] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

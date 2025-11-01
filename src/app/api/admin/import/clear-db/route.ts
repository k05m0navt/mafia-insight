import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { clearDatabase } from '@/lib/admin/database-clear-service';

/**
 * POST /api/admin/import/clear-db
 * Clear all imported game data from the database
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize request
    const { user, role } = await authenticateRequest(request);

    // Check if user has admin role
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Parse request body for confirmation
    const body = await request.json();
    if (!body.confirm) {
      return NextResponse.json(
        { error: 'Must confirm database clear operation' },
        { status: 400 }
      );
    }

    // Clear the database
    const result = await clearDatabase(user.id);

    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully',
      deleted: result.deleted,
    });
  } catch (error: unknown) {
    console.error('Clear database API error:', error);

    // Handle specific errors
    if (
      error instanceof Error &&
      error.message?.includes('Cannot clear database')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Handle authentication errors
    if (error instanceof Error && error.message?.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Handle authorization errors
    if (error instanceof Error && error.message?.includes('Role')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Failed to clear database' },
      { status: 500 }
    );
  }
}

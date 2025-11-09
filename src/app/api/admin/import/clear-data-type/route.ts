import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import {
  clearDataType,
  type DeletableDataType,
} from '@/lib/admin/database-clear-service';

/**
 * POST /api/admin/import/clear-data-type
 * Clear specific type of data from the database
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

    // Parse request body
    const body = await request.json();
    const { dataType, confirm } = body;

    if (!confirm) {
      return NextResponse.json(
        { error: 'Must confirm data deletion operation' },
        { status: 400 }
      );
    }

    if (!dataType) {
      return NextResponse.json(
        { error: 'Data type is required' },
        { status: 400 }
      );
    }

    // Validate data type
    const validDataTypes: DeletableDataType[] = [
      'tournaments',
      'players',
      'clubs',
      'games',
      'player_statistics',
      'tournament_results',
      'judges',
      'all',
    ];
    if (!validDataTypes.includes(dataType)) {
      return NextResponse.json(
        {
          error: `Invalid data type. Must be one of: ${validDataTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Clear the specified data type
    const result = await clearDataType(dataType as DeletableDataType, user.id);

    return NextResponse.json({
      success: true,
      message: `${dataType} data cleared successfully`,
      deleted: result.deleted,
      dataType: result.dataType,
    });
  } catch (error: unknown) {
    console.error('Clear data type API error:', error);

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
      { error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}

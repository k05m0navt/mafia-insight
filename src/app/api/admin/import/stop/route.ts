import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { cancelImport } from '@/lib/admin/import-control-service';

/**
 * POST /api/admin/import/stop
 * Cancel a running import operation
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

    // Get importId from request body if provided
    const body = await request.json().catch(() => ({}));
    const { importId } = body;

    // Cancel the import
    await cancelImport(user.id, importId);

    return NextResponse.json({
      success: true,
      message: 'Import stopped successfully',
    });
  } catch (error: unknown) {
    console.error('Stop import API error:', error);

    // Handle specific errors
    if (
      error instanceof Error &&
      error.message?.includes('No import operation')
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
      { error: 'Failed to stop import' },
      { status: 500 }
    );
  }
}

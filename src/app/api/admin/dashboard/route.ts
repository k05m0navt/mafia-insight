import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { getDashboardMetrics } from '@/lib/admin/dashboard-service';

/**
 * GET /api/admin/dashboard
 * Fetch comprehensive dashboard metrics for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize request
    const { user: _user, role } = await authenticateRequest(request);

    // Check if user has admin role
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch dashboard metrics
    const metrics = await getDashboardMetrics();

    return NextResponse.json(metrics);
  } catch (error: unknown) {
    console.error('Dashboard API error:', error);

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
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}

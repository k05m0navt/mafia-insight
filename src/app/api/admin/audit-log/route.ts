import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/apiAuth';
import { formatErrorResponse } from '@/lib/errors';
import { getAuditLogs } from '@/lib/audit/audit-log';
import { AuditActionType } from '@prisma/client';

/**
 * GET /api/admin/audit-log
 * Get audit log entries with pagination and filtering (admin only)
 * Query parameters:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 50, max: 100)
 *   - actionType: Filter by action type
 *   - adminUserId: Filter by admin user ID
 *   - targetUserId: Filter by target user ID
 *   - startDate: Filter by start date (ISO string)
 *   - endDate: Filter by end date (ISO string)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and verify admin role
    await withAdminAuth(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '50', 10))
    );
    const actionType = searchParams.get('actionType');
    const adminUserId = searchParams.get('adminUserId');
    const targetUserId = searchParams.get('targetUserId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const result = await getAuditLogs({
      page,
      limit,
      actionType: actionType ? (actionType as AuditActionType) : undefined,
      adminUserId: adminUserId || undefined,
      targetUserId: targetUserId || undefined,
      startDate,
      endDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get audit log error:', error);

    if (error instanceof Error) {
      const errorResponse = formatErrorResponse(error);
      return NextResponse.json(errorResponse, {
        status:
          errorResponse.code === 'AUTHORIZATION_ERROR'
            ? 403
            : errorResponse.code === 'AUTHENTICATION_ERROR'
              ? 401
              : 500,
      });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch audit logs',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

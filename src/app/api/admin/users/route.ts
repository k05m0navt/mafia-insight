import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/apiAuth';
import { formatErrorResponse } from '@/lib/errors';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/users
 * Get all users with pagination, search, and filtering (admin only)
 * Query parameters:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 50, max: 100)
 *   - search: Search by email or name
 *   - role: Filter by role (user, admin, moderator, guest)
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
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      role?: string;
      OR?: Array<{ email?: { contains: string }; name?: { contains: string } }>;
    } = {};

    // Role filter
    if (roleFilter) {
      where.role = roleFilter.toLowerCase();
    }

    // Search filter (email or name)
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);

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
        error: 'Failed to fetch users',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Method not allowed - POST is not part of the admin user management story requirements.
 * Only GET is implemented per AC #1.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'POST method is not supported' },
    { status: 405 }
  );
}

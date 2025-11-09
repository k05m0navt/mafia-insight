import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/apiAuth';
import { formatErrorResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Authenticate with admin access
    await withAdminAuth()(request);

    // Return protected route configuration
    const protectedRoutes = [
      {
        path: '/admin',
        methods: ['GET'],
        requiredRole: 'ADMIN',
        description: 'Admin dashboard access',
      },
      {
        path: '/api/admin',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        requiredRole: 'ADMIN',
        description: 'Admin API endpoints',
      },
      {
        path: '/admin/import',
        methods: ['GET', 'POST'],
        requiredRole: 'ADMIN',
        description: 'Data import operations',
      },
    ];

    return NextResponse.json({
      routes: protectedRoutes,
      total: protectedRoutes.length,
    });
  } catch (error) {
    console.error('Admin routes error:', error);

    if (error instanceof Error) {
      const errorResponse = formatErrorResponse(error);
      return NextResponse.json(errorResponse, {
        status: errorResponse.code === 'AUTHORIZATION_ERROR' ? 403 : 500,
      });
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getNavigationMenu } from '@/lib/navigation';
import { UserRole } from '@/types/navigation';
import { formatErrorResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Get user role from cookie (GUEST access - no authentication required)
    const userRole = request.cookies.get('user-role')?.value || 'GUEST';

    // Get navigation menu based on user role
    const menuItems = getNavigationMenu(userRole as UserRole);

    return NextResponse.json({
      items: menuItems,
    });
  } catch (error) {
    console.error('Navigation menu error:', error);

    if (error instanceof Error) {
      const errorResponse = formatErrorResponse(error);
      return NextResponse.json(errorResponse, {
        status: errorResponse.code === 'AUTHENTICATION_ERROR' ? 401 : 500,
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

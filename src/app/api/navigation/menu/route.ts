import { NextRequest, NextResponse } from 'next/server';
import { getNavigationMenu } from '@/lib/navigation';
import { withAuth } from '@/lib/apiAuth';
import { formatErrorResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const { role } = await withAuth('GUEST')(request);

    // Get navigation menu based on user role
    const menuItems = getNavigationMenu(role as any);

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

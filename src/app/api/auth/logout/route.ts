import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/utils/apiAuth';

/**
 * POST /api/auth/logout
 * Clear authentication cookies and end session
 */
export async function POST(_request: NextRequest) {
  try {
    // Clear auth cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    clearAuthCookies(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed',
      },
      { status: 500 }
    );
  }
}

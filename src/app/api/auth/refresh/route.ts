import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/refresh
 * Refresh expired session token
 */
export async function POST(request: NextRequest) {
  try {
    // Check if auth-token cookie exists (even if expired)
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session refresh failed',
          code: 'SESSION_EXPIRED',
        },
        { status: 401 }
      );
    }

    // Verify with Supabase to refresh session
    const supabase = await createRouteHandlerClient();

    // Try to get current user - if token is expired, this will fail
    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !authUser) {
      // Try to refresh the session
      const {
        data: { session },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError || !session) {
        return NextResponse.json(
          {
            success: false,
            error: 'Session refresh failed',
            code: 'SESSION_EXPIRED',
          },
          { status: 401 }
        );
      }

      // New session token
      const newToken = session.access_token;
      const expiresAt = new Date(session.expires_at! * 1000);

      // Set new cookies
      const response = NextResponse.json({
        success: true,
        token: newToken,
        expiresAt: expiresAt.toISOString(),
        message: 'Session refreshed',
      });

      // Set auth-token cookie
      response.cookies.set('auth-token', newToken, {
        httpOnly: false, // Client-side access needed
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      // Set user-role cookie if available
      if (session.user?.user_metadata?.role) {
        response.cookies.set('user-role', session.user.user_metadata.role, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
          path: '/',
        });
      }

      return response;
    }

    // User is still valid - return current session info
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (!currentSession) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active session',
          code: 'SESSION_EXPIRED',
        },
        { status: 401 }
      );
    }

    const expiresAt = new Date(currentSession.expires_at! * 1000);

    return NextResponse.json({
      success: true,
      token: currentSession.access_token,
      expiresAt: expiresAt.toISOString(),
      message: 'Session is valid',
    });
  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Session refresh failed',
        code: 'SESSION_EXPIRED',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { requireAuthCookie } from '@/lib/utils/apiAuth';

/**
 * GET /api/auth/permissions
 * Get permissions for current user
 */
export async function GET(request: NextRequest) {
  try {
    // Check auth-token cookie first (primary auth method)
    const authError = requireAuthCookie(request);
    if (authError) {
      return authError;
    }

    // Verify with Supabase for user data
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return permissions based on user role
    // This is a simplified version - in production you'd query from database
    const permissions: string[] = [];

    // Add role-based permissions
    // This would typically come from a database query
    // For now, return basic permissions structure

    return NextResponse.json({
      permissions,
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

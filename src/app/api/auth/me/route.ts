import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { requireAuthCookie } from '@/lib/utils/apiAuth';

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Check auth-token cookie first (primary auth method)
    const authError = requireAuthCookie(request);
    if (authError) {
      return authError;
    }

    // Also verify with Supabase for user data
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        subscriptionTier: true,
        themePreference: true,
        createdAt: true,
        lastLogin: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Map to match User type
    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
      role: profile.role,
      isActive: true,
      lastLoginAt: profile.lastLogin,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

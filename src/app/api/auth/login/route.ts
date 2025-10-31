import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/db';

// Login request body schema
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Initialize Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * POST /api/auth/login
 * Authenticate user and return session data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = LoginSchema.parse(body);

    // Sign in user with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json(
        {
          success: false,
          error: authError.message,
        },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
        },
        { status: 401 }
      );
    }

    // Get user profile using Prisma (best for server-side auth queries)
    // Prisma bypasses RLS and connects directly via DATABASE_URL
    console.log(
      '[LOGIN API] Querying user profile with Prisma for user:',
      authData.user.id
    );

    let profile = null;
    let profileError = null;

    try {
      profile = await prisma.user.findUnique({
        where: { id: authData.user.id },
      });
      console.log(
        '[LOGIN API] Profile found:',
        profile
          ? { id: profile.id, email: profile.email, role: profile.role }
          : 'null'
      );
    } catch (error) {
      profileError = error;
      console.error('[LOGIN API] Profile query error:', error);
    }

    // If profile doesn't exist, create a basic one
    let userProfile = profile;
    if (
      profileError &&
      typeof profileError === 'object' &&
      'code' in profileError &&
      profileError.code === 'PGRST116'
    ) {
      // Profile doesn't exist, create it
      console.log('[LOGIN API] Creating new user profile');
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: authData.user.user_metadata?.name || 'User',
          role: 'user',
          subscriptionTier: 'FREE',
          themePreference: 'system',
          lastLogin: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('[LOGIN API] Profile creation error:', createError);
        // Continue without profile - user can still log in
      } else {
        userProfile = newProfile;
      }
    } else if (profileError) {
      // Some other error occurred
      console.error('[LOGIN API] Profile query error:', profileError);
    } else if (userProfile) {
      // Update lastLogin timestamp for existing users
      console.log('[LOGIN API] Updating lastLogin for existing user');
      await supabase
        .from('users')
        .update({ lastLogin: new Date().toISOString() })
        .eq('id', authData.user.id);
    }

    const userName =
      userProfile?.name || authData.user.user_metadata?.name || 'User';

    // TEMPORARY FIX: Force query database directly with service role
    // Check if profile query failed and retry with direct query
    let userRole = userProfile?.role;

    if (!userRole) {
      console.log(
        '[LOGIN API] Profile role missing, querying database directly'
      );
      const { data: directProfile } = await supabase
        .from('users')
        .select('role')
        .eq('email', data.email)
        .single();

      userRole = directProfile?.role || 'user';
      console.log('[LOGIN API] Direct query result:', directProfile);
    }

    console.log('[LOGIN API] User profile:', {
      id: authData.user.id,
      email: data.email,
      name: userName,
      role: userRole,
      profileRole: userProfile?.role,
      finalRole: userRole,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: data.email,
        name: userName,
        role: userRole,
        avatar: userProfile?.avatar,
      },
      token: authData.session?.access_token || 'mock-token-' + Date.now(),
      expiresAt: authData.session?.expires_at
        ? new Date(authData.session.expires_at * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
      message: `Welcome back, ${userName}!`,
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Login failed',
      },
      { status: 500 }
    );
  }
}

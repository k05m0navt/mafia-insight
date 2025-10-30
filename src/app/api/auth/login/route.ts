import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Login request body schema
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

    // Get user profile from our users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // If profile doesn't exist, create a basic one
    let userProfile = profile;
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: authData.user.user_metadata?.name || 'User',
          role: 'user',
          subscriptionTier: 'FREE',
          themePreference: 'system',
        })
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        // Continue without profile - user can still log in
      } else {
        userProfile = newProfile;
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: data.email,
        name: userProfile?.name || authData.user.user_metadata?.name || 'User',
        role: userProfile?.role || 'user',
      },
      token: authData.session?.access_token || 'mock-token-' + Date.now(),
      expiresAt: authData.session?.expires_at
        ? new Date(authData.session.expires_at * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
      message: 'Login successful',
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

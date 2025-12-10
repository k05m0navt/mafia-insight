import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { registrationSchema } from '@/lib/auth/validation';
import { setAuthTokenCookie, setUserRoleCookie } from '@/lib/utils/apiAuth';
import { z } from 'zod';

/**
 * POST /api/auth/signup
 * Create a new user account with email/password authentication
 *
 * Validates registration data using RFC 5322 email validation and password requirements,
 * creates user via Supabase Auth (handles password hashing), and creates user profile
 * in database via Prisma.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body using Zod schema (RFC 5322 email, password requirements)
    const validationResult = registrationSchema.safeParse(body);

    if (!validationResult.success) {
      const errorDetails = validationResult.error?.issues || [];
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errorDetails.map((err: z.ZodIssue) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email already exists',
        },
        { status: 409 } // Conflict
      );
    }

    // Create Supabase client with SSR cookie support
    const supabase = await createRouteHandlerClient();

    // Sign up user with Supabase Auth (handles password hashing with bcrypt, salt rounds ≥10)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email`,
      },
    });

    if (authError) {
      console.error('[SIGNUP API] Supabase auth error:', authError);

      // Map Supabase errors to user-friendly messages
      let errorMessage = authError.message;
      if (authError.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (authError.message.includes('Password')) {
        errorMessage = 'Password does not meet requirements';
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user account',
        },
        { status: 500 }
      );
    }

    // Create user profile in database via Prisma (default role: user)
    try {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          email: data.email,
          name: data.name,
          role: 'user', // Default role (UserRole enum: 'user', 'admin', 'guest', 'moderator')
          subscriptionTier: 'FREE',
          themePreference: 'system',
        },
      });
    } catch (profileError) {
      console.error('[SIGNUP API] Profile creation error:', profileError);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user profile. Please try again.',
        },
        { status: 500 }
      );
    }

    // Create response
    const token = authData.session?.access_token || 'mock-token-' + Date.now();
    const expiresAt = authData.session?.expires_at
      ? new Date(authData.session.expires_at * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: 'user',
      },
      token,
      expiresAt,
      message:
        'Account created successfully. Please check your email to verify your account.',
    });

    // Set auth-token and user-role cookies server-side
    setAuthTokenCookie(response, token, expiresAt);
    setUserRoleCookie(response, 'user', expiresAt);

    return response;
  } catch (error) {
    console.error('[SIGNUP API] Registration error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create account. Please try again.',
      },
      { status: 500 }
    );
  }
}

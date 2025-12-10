import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  type: z.string().optional().default('email'),
});

/**
 * POST /api/auth/verify-email
 * Verify email address using Supabase Auth token
 *
 * Supabase Auth handles token generation and email sending.
 * This endpoint verifies the token from the email link.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, type } = VerifyEmailSchema.parse(body);

    // Create Supabase client with SSR cookie support
    const supabase = await createRouteHandlerClient();

    // Verify the email token using Supabase Auth
    // Supabase handles token validation and expiration (24 hours)
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'email',
    });

    if (error) {
      console.error('[VERIFY EMAIL API] Supabase verification error:', error);

      // Map Supabase errors to user-friendly messages
      let errorMessage = error.message;
      if (
        error.message.includes('expired') ||
        error.message.includes('invalid')
      ) {
        errorMessage =
          'This verification link has expired or is invalid. Please request a new one.';
      } else if (error.message.includes('already verified')) {
        errorMessage = 'This email has already been verified.';
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify email. Please try again.',
        },
        { status: 500 }
      );
    }

    // Update user's email_verified status in our database if needed
    // (Supabase Auth handles this automatically, but we can sync it)
    try {
      const { prisma } = await import('@/lib/db');
      await prisma.user.update({
        where: { id: data.user.id },
        data: {
          updatedAt: new Date(),
        },
      });
    } catch (dbError) {
      // Don't fail verification if database update fails
      console.error('[VERIFY EMAIL API] Database update error:', dbError);
    }

    // Note: NextAuth session will be created automatically when user signs in
    // after email verification. The session is managed through the CredentialsProvider
    // in NextAuth configuration, which uses Supabase Auth for authentication.

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        emailVerified: data.user.email_confirmed_at !== null,
      },
    });
  } catch (error) {
    console.error('[VERIFY EMAIL API] Verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request. Token is required.',
          details: (error as z.ZodError).issues.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify email. Please try again.',
      },
      { status: 500 }
    );
  }
}

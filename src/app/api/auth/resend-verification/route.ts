import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ResendVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * POST /api/auth/resend-verification
 * Resend email verification email
 *
 * Uses Supabase Auth to resend the verification email.
 * Supabase handles rate limiting and token generation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = ResendVerificationSchema.parse(body);

    // Create Supabase client with SSR cookie support
    const supabase = await createRouteHandlerClient();

    // Resend verification email via Supabase Auth
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email`,
      },
    });

    if (error) {
      console.error('[RESEND VERIFICATION API] Supabase error:', error);

      // Map Supabase errors to user-friendly messages
      let errorMessage = error.message;
      if (error.message.includes('rate limit')) {
        errorMessage =
          'Too many requests. Please wait a few minutes before requesting another email.';
      } else if (error.message.includes('already verified')) {
        errorMessage = 'This email has already been verified.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'No account found with this email address.';
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
    });
  } catch (error) {
    console.error('[RESEND VERIFICATION API] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address',
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
        error: 'Failed to resend verification email. Please try again.',
      },
      { status: 500 }
    );
  }
}

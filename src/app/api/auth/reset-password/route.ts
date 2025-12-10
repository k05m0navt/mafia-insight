import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { passwordSchema } from '@/lib/auth/validation';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

// Password reset schema
const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown';
  return ip;
}

/**
 * Verify token hash matches stored hash
 */
async function verifyToken(token: string, tokenHash: string): Promise<boolean> {
  return bcrypt.compare(token, tokenHash);
}

/**
 * Log password reset completion to security_events table
 */
async function logPasswordResetCompletion(
  userId: string,
  email: string,
  ipAddress: string,
  success: boolean,
  reason?: string
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: success
          ? 'PASSWORD_RESET_COMPLETED'
          : 'PASSWORD_RESET_FAILED',
        userId,
        email,
        ipAddress,
        userAgent: 'unknown',
        details: {
          success,
          reason:
            reason ||
            (success ? 'Password reset successful' : 'Password reset failed'),
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.warn('[RESET-PASSWORD API] Failed to log security event:', error);
  }
}

/**
 * Invalidate all existing sessions for a user
 * This is a security requirement - when password is reset, all sessions should be invalidated
 *
 * Uses Supabase Admin API to sign out all sessions for the user globally.
 * This revokes all refresh tokens for the user, effectively signing them out from all devices.
 * Note: Access tokens remain valid until expiration, but cannot be refreshed.
 */
async function invalidateUserSessions(userId: string): Promise<void> {
  try {
    const supabaseAdmin = createSupabaseAdminClient();

    // Sign out all sessions for the user using Supabase Admin API
    // This revokes all refresh tokens, effectively invalidating all sessions
    const { error: signOutError } =
      await supabaseAdmin.auth.admin.signOut(userId);

    if (signOutError) {
      // Log error but don't throw - password reset is still successful
      // Supabase's password change via updateUserById already invalidates refresh tokens
      console.warn(
        '[RESET-PASSWORD API] Error signing out user sessions:',
        signOutError.message
      );
      // Continue execution - password reset is still successful
      return;
    }

    console.log(
      '[RESET-PASSWORD API] Successfully invalidated all sessions for user:',
      userId
    );

    // Note: This revokes all refresh tokens for the user. Access tokens remain valid
    // until expiration (typically 1 hour), but cannot be refreshed, effectively
    // invalidating sessions on the next refresh attempt. This meets the security
    // requirement of invalidating sessions after password reset.
  } catch (error) {
    // Don't throw error - session invalidation failure shouldn't block password reset
    // Log the error for monitoring but continue execution
    console.error('[RESET-PASSWORD API] Error invalidating sessions:', error);
    // Password reset is still successful - Supabase's password change already
    // invalidates refresh tokens, which will cause sessions to fail on next refresh
  }
}

/**
 * GET /api/auth/reset-password?token=...
 * Validate password reset token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Token is required',
        },
        { status: 400 }
      );
    }

    // Find all unused, unexpired tokens
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        expiresAt: {
          gt: new Date(), // Not expired
        },
        usedAt: null, // Not used
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Try to verify token against each potential token
    let validToken = null;
    for (const resetToken of resetTokens) {
      const isValid = await verifyToken(token, resetToken.tokenHash);
      if (isValid) {
        validToken = resetToken;
        break;
      }
    }

    if (!validToken) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid or expired token',
        },
        { status: 410 } // Gone - token expired or invalid
      );
    }

    // Token is valid
    return NextResponse.json(
      {
        valid: true,
        expiresAt: validToken.expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[RESET-PASSWORD API] Token validation error:', error);

    return NextResponse.json(
      {
        valid: false,
        error: 'An error occurred while validating the token',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    const body = await request.json();
    const validationResult = ResetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error?.issues || [],
        },
        { status: 400 }
      );
    }

    const { token, newPassword } = validationResult.data;

    // Find all unused, unexpired tokens
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        expiresAt: {
          gt: new Date(), // Not expired
        },
        usedAt: null, // Not used
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Try to verify token against each potential token
    let resetToken = null;
    for (const tokenRecord of resetTokens) {
      const isValid = await verifyToken(token, tokenRecord.tokenHash);
      if (isValid) {
        resetToken = tokenRecord;
        break;
      }
    }

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
        },
        { status: 410 } // Gone
      );
    }

    // Create Supabase admin client (requires service role key)
    const supabaseAdmin = createSupabaseAdminClient();

    // Update password in Supabase Auth using admin API
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(resetToken.userId, {
        password: newPassword,
      });

    if (updateError) {
      console.error(
        '[RESET-PASSWORD API] Error updating password:',
        updateError
      );

      await logPasswordResetCompletion(
        resetToken.userId,
        resetToken.user.email,
        clientIp,
        false,
        updateError.message
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update password. Please try again.',
        },
        { status: 500 }
      );
    }

    // Mark token as used (single-use token)
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all existing sessions for security
    await invalidateUserSessions(resetToken.userId);

    // Log successful password reset
    await logPasswordResetCompletion(
      resetToken.userId,
      resetToken.user.email,
      clientIp,
      true
    );

    return NextResponse.json(
      {
        success: true,
        message:
          'Password reset successfully. Please log in with your new password.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[RESET-PASSWORD API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}

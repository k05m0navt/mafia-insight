import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendEmailChangeConfirmationEmails } from '@/lib/email';
import bcrypt from 'bcryptjs';

// Token validation schema
const EmailChangeVerifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return ip;
}

/**
 * Verify token hash matches stored hash
 */
async function verifyToken(token: string, tokenHash: string): Promise<boolean> {
  return bcrypt.compare(token, tokenHash);
}

/**
 * Invalidate all existing sessions for a user
 * Security requirement: When email is changed, all sessions must be invalidated
 *
 * Uses Supabase Admin API to sign out all sessions for the user globally.
 */
async function invalidateUserSessions(userId: string): Promise<void> {
  try {
    const supabaseAdmin = createSupabaseAdminClient();

    // Sign out all sessions for the user using Supabase Admin API
    const { error: signOutError } =
      await supabaseAdmin.auth.admin.signOut(userId);

    if (signOutError) {
      console.warn(
        '[EMAIL-CHANGE-VERIFY API] Error signing out user sessions:',
        signOutError.message
      );
      return;
    }

    console.log(
      '[EMAIL-CHANGE-VERIFY API] Successfully invalidated all sessions for user:',
      userId
    );
  } catch (error) {
    console.error(
      '[EMAIL-CHANGE-VERIFY API] Error invalidating sessions:',
      error
    );
  }
}

/**
 * Log email change completion to security_events table
 */
async function logEmailChangeCompletion(
  userId: string,
  oldEmail: string,
  newEmail: string,
  ipAddress: string,
  success: boolean,
  reason?: string
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: success ? 'EMAIL_CHANGE_COMPLETED' : 'EMAIL_CHANGE_FAILED',
        userId,
        email: oldEmail,
        ipAddress,
        userAgent: 'unknown',
        details: {
          success,
          oldEmail,
          newEmail,
          reason:
            reason ||
            (success
              ? 'Email change completed successfully'
              : 'Email change failed'),
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.warn(
      '[EMAIL-CHANGE-VERIFY API] Failed to log security event:',
      error
    );
  }
}

/**
 * POST /api/user/profile/email/verify
 * Verify email change token and update email address
 *
 * Features:
 * - Validates token and expiration
 * - Updates email in database
 * - Invalidates all existing sessions (security requirement)
 * - Sends confirmation emails to old and new addresses
 * - Logs email change events for audit trail
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    const body = await request.json();
    const validationResult = EmailChangeVerifySchema.safeParse(body);

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

    const { token } = validationResult.data;

    // Find all unused, unexpired email change tokens
    const emailChangeTokens = await prisma.emailChangeToken.findMany({
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
    let emailChangeToken = null;
    for (const tokenRecord of emailChangeTokens) {
      const isValid = await verifyToken(token, tokenRecord.tokenHash);
      if (isValid) {
        emailChangeToken = tokenRecord;
        break;
      }
    }

    if (!emailChangeToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
        },
        { status: 410 } // Gone
      );
    }

    // Check if new email is still available (might have been taken since request)
    const existingUser = await prisma.user.findUnique({
      where: { email: emailChangeToken.newEmail.toLowerCase() },
    });

    if (existingUser && existingUser.id !== emailChangeToken.userId) {
      await logEmailChangeCompletion(
        emailChangeToken.userId,
        emailChangeToken.user.email,
        emailChangeToken.newEmail,
        clientIp,
        false,
        'New email address is already in use'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'This email address is already in use',
        },
        { status: 400 }
      );
    }

    const oldEmail = emailChangeToken.user.email;

    // Create Supabase admin client
    const supabaseAdmin = createSupabaseAdminClient();

    // Update email in Supabase Auth using admin API
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(emailChangeToken.userId, {
        email: emailChangeToken.newEmail.toLowerCase(),
      });

    if (updateError) {
      console.error(
        '[EMAIL-CHANGE-VERIFY API] Error updating email in Supabase:',
        updateError
      );

      await logEmailChangeCompletion(
        emailChangeToken.userId,
        oldEmail,
        emailChangeToken.newEmail,
        clientIp,
        false,
        updateError.message
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update email. Please try again.',
        },
        { status: 500 }
      );
    }

    // Update email in database
    await prisma.user.update({
      where: { id: emailChangeToken.userId },
      data: {
        email: emailChangeToken.newEmail.toLowerCase(),
        updatedAt: new Date(),
      },
    });

    // Mark token as used (single-use token)
    await prisma.emailChangeToken.update({
      where: { id: emailChangeToken.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all existing sessions for security
    await invalidateUserSessions(emailChangeToken.userId);

    // Send confirmation emails to old and new email addresses
    await sendEmailChangeConfirmationEmails(
      oldEmail,
      emailChangeToken.newEmail.toLowerCase()
    );

    // Log successful email change
    await logEmailChangeCompletion(
      emailChangeToken.userId,
      oldEmail,
      emailChangeToken.newEmail,
      clientIp,
      true
    );

    return NextResponse.json({
      success: true,
      message:
        'Email address updated successfully. All sessions have been invalidated for security. Please sign in again with your new email address.',
    });
  } catch (error) {
    console.error('[EMAIL-CHANGE-VERIFY API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}

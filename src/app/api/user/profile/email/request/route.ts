import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { emailSchema } from '@/lib/auth/validation';
import { authenticateRequest } from '@/lib/apiAuth';
import { checkRateLimit } from '@/lib/rateLimiter';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEmailChangeVerificationEmail } from '@/lib/email';

// Request body schema
const EmailChangeRequestSchema = z.object({
  newEmail: emailSchema,
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
 * Generate secure random token (32+ characters, URL-safe)
 */
function generateEmailChangeToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hash token using bcrypt before storing
 */
async function hashToken(token: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(token, saltRounds);
}

/**
 * Log email change request to security_events table
 */
async function logEmailChangeRequest(
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
        eventType: success
          ? 'EMAIL_CHANGE_REQUESTED'
          : 'EMAIL_CHANGE_REQUEST_FAILED',
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
              ? 'Email change verification email sent'
              : 'Request failed'),
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.warn(
      '[EMAIL-CHANGE-REQUEST API] Failed to log security event:',
      error
    );
  }
}

/**
 * POST /api/user/profile/email/request
 * Request email change verification
 *
 * Features:
 * - Email validation (RFC 5322)
 * - Unique email check (new email must not be in use)
 * - Rate limiting (3 requests/hour/user)
 * - Secure token generation and hashing
 * - 24-hour token expiration
 * - Security event logging
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    const { user } = await authenticateRequest(request);

    const body = await request.json();
    const validationResult = EmailChangeRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
          details: validationResult.error?.issues || [],
        },
        { status: 400 }
      );
    }

    const { newEmail } = validationResult.data;

    // Check if new email is the same as current email
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: 'New email must be different from current email',
        },
        { status: 400 }
      );
    }

    // Check if new email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'This email address is already in use',
        },
        { status: 400 }
      );
    }

    // Rate limiting: 3 requests per hour per user
    const rateLimitResult = await checkRateLimit(`email_change:${user.id}`, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      keyPrefix: 'email_change_rate_limit:',
    });

    if (!rateLimitResult.allowed) {
      await logEmailChangeRequest(
        user.id,
        user.email,
        newEmail,
        clientIp,
        false,
        'Rate limit exceeded'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Too many email change requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // Generate secure random token
    const verificationToken = generateEmailChangeToken();

    // Hash token before storing
    const tokenHash = await hashToken(verificationToken);

    // Calculate expiration (24 hours from now as per story requirements)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store token in database
    try {
      await prisma.emailChangeToken.create({
        data: {
          userId: user.id,
          newEmail: newEmail.toLowerCase(),
          tokenHash,
          expiresAt,
        },
      });

      // Send verification email to new email address
      await sendEmailChangeVerificationEmail(
        user.email,
        newEmail,
        verificationToken
      );

      // Log successful email change request
      await logEmailChangeRequest(
        user.id,
        user.email,
        newEmail,
        clientIp,
        true
      );

      return NextResponse.json({
        success: true,
        message:
          'Verification email sent to your new email address. Please check your email to complete the change.',
      });
    } catch (error) {
      console.error(
        '[EMAIL-CHANGE-REQUEST API] Error creating email change token:',
        error
      );
      await logEmailChangeRequest(
        user.id,
        user.email,
        newEmail,
        clientIp,
        false,
        'Failed to create email change token'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process email change request. Please try again.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[EMAIL-CHANGE-REQUEST API] Error:', error);

    if (
      error instanceof Error &&
      error.message.includes('Authentication required')
    ) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}

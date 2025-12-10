import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { emailSchema } from '@/lib/auth/validation';
import { checkRateLimit } from '@/lib/rateLimiter';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Request body schema
const ForgotPasswordSchema = z.object({
  email: emailSchema,
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
 * Generate secure random token (32+ characters, URL-safe)
 */
function generateResetToken(): string {
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
 * Log password reset request to security_events table
 */
async function logPasswordResetRequest(
  email: string,
  ipAddress: string,
  userId: string | null,
  success: boolean,
  reason?: string
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: success
          ? 'PASSWORD_RESET_REQUESTED'
          : 'PASSWORD_RESET_REQUEST_FAILED',
        userId,
        email,
        ipAddress,
        userAgent: 'unknown', // Could extract from request if needed
        details: {
          success,
          reason:
            reason ||
            (success ? 'Password reset email sent' : 'Request failed'),
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    // Log to console if database logging fails
    console.warn('[FORGOT-PASSWORD API] Failed to log security event:', error);
    console.warn('[FORGOT-PASSWORD API] Security event details:', {
      eventType: success
        ? 'PASSWORD_RESET_REQUESTED'
        : 'PASSWORD_RESET_REQUEST_FAILED',
      email,
      ipAddress,
      userId,
      success,
      reason,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Log rate limit violation to security_events table
 */
async function logRateLimitViolation(
  email: string,
  ipAddress: string
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
        userId: null,
        email,
        ipAddress,
        userAgent: 'unknown',
        details: {
          reason: 'Rate limit exceeded: 3 requests per hour',
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.warn(
      '[FORGOT-PASSWORD API] Failed to log rate limit violation:',
      error
    );
  }
}

import { sendPasswordResetEmail } from '@/lib/email';

/**
 * POST /api/auth/forgot-password
 * Request password reset via email
 *
 * Features:
 * - Email validation (RFC 5322)
 * - Rate limiting (3 requests/hour/email)
 * - Account enumeration prevention
 * - Secure token generation and hashing
 * - Security event logging
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  try {
    const body = await request.json();
    const validationResult = ForgotPasswordSchema.safeParse(body);

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

    const { email } = validationResult.data;

    // Rate limiting: 3 requests per hour per email address
    const rateLimitResult = await checkRateLimit(`password_reset:${email}`, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      keyPrefix: 'password_reset_rate_limit:',
    });

    if (!rateLimitResult.allowed) {
      // Log rate limit violation
      await logRateLimitViolation(email, clientIp);

      return NextResponse.json(
        {
          success: false,
          error: 'Too many password reset requests. Please try again later.',
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

    // Check if user exists (for account enumeration prevention, we'll always proceed)
    // but we need the userId if user exists to create the token
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error('[FORGOT-PASSWORD API] Error checking user:', error);
    }

    // Account enumeration prevention: Always return same response
    // But only create token if user actually exists
    if (user) {
      // Generate secure random token
      const resetToken = generateResetToken();

      // Hash token before storing
      const tokenHash = await hashToken(resetToken);

      // Calculate expiration (1 hour from now)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Store token in database
      try {
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        });

        // Send password reset email
        await sendPasswordResetEmail(email, resetToken);

        // Log successful password reset request
        await logPasswordResetRequest(email, clientIp, user.id, true);
      } catch (error) {
        console.error(
          '[FORGOT-PASSWORD API] Error creating reset token:',
          error
        );
        // Still log the attempt
        await logPasswordResetRequest(
          email,
          clientIp,
          user.id,
          false,
          'Failed to create reset token'
        );

        // Return generic error (account enumeration prevention)
        return NextResponse.json(
          {
            success: true,
            message:
              'If an account exists with this email, a password reset link has been sent.',
          },
          { status: 200 }
        );
      }
    } else {
      // User doesn't exist, but we still log the attempt for security monitoring
      await logPasswordResetRequest(
        email,
        clientIp,
        null,
        false,
        'User not found'
      );
    }

    // Account enumeration prevention: Always return same message
    return NextResponse.json(
      {
        success: true,
        message:
          'If an account exists with this email, a password reset link has been sent.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[FORGOT-PASSWORD API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}

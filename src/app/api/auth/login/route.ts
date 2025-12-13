import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { setAuthTokenCookie, setUserRoleCookie } from '@/lib/utils/apiAuth';
import { checkRateLimit } from '@/lib/rateLimiter';

// Login request body schema
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
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
 * Log failed login attempt to security_events table
 */
async function logFailedLoginAttempt(
  email: string,
  ipAddress: string,
  reason: string
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: 'LOGIN_FAILED',
        userId: null, // User not found or invalid credentials
        email,
        ipAddress,
        userAgent: 'unknown', // Could extract from request if needed
        details: {
          reason,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    // Log to console if database logging fails (e.g., table doesn't exist yet)
    console.warn(
      '[LOGIN API] Failed to log security event (table may not exist yet):',
      error
    );
    console.warn('[LOGIN API] Security event details:', {
      eventType: 'LOGIN_FAILED',
      email,
      ipAddress,
      reason,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return session data
 * Implements rate limiting (5 attempts/hour/IP), account enumeration prevention,
 * and security event logging
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // Rate limiting: 5 attempts per hour per IP
  const rateLimitResult = await checkRateLimit(`login:${clientIp}`, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    keyPrefix: 'login_rate_limit:',
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many login attempts. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const data = LoginSchema.parse(body);

    // Create Supabase client with SSR cookie support for session management
    const supabase = await createRouteHandlerClient();

    // Sign in user with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    // Account enumeration prevention: Always return same error message
    // Log failed attempts regardless of whether email exists
    if (authError || !authData.user) {
      // Log failed login attempt
      await logFailedLoginAttempt(
        data.email,
        clientIp,
        authError?.message || 'Invalid credentials'
      );

      // Return generic error message to prevent account enumeration
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
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
          themePreference: 'light',
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
    let userRole: string = userProfile?.role || 'user';

    if (!userProfile?.role) {
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

    // Create response
    // Set session expiration based on rememberMe: 7 days for JWT, 30 days for refresh token
    // If rememberMe is true, extend session duration
    const sessionDuration = data.rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days
      : 7 * 24 * 60 * 60 * 1000; // 7 days

    const token = authData.session?.access_token || 'mock-token-' + Date.now();
    const expiresAt = authData.session?.expires_at
      ? new Date(authData.session.expires_at * 1000)
      : new Date(Date.now() + sessionDuration);

    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: data.email,
        name: userName,
        role: userRole,
        avatar: userProfile?.avatar,
      },
      token,
      expiresAt,
      message: `Welcome back, ${userName}!`,
    });

    // Set auth-token and user-role cookies server-side
    setAuthTokenCookie(response, token, expiresAt);
    setUserRoleCookie(response, userRole, expiresAt);

    return response;
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

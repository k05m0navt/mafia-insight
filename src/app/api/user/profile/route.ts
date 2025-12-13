import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/apiAuth';

// Profile update schema
const ProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

/**
 * GET /api/user/profile
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        subscriptionTier: true,
        themePreference: true,
        emailNotifications: true,
        pushNotifications: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);

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
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Update current user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);

    const body = await request.json();
    const data = ProfileUpdateSchema.parse(body);

    // Prepare update data
    const updateData: {
      name?: string;
      themePreference?: string;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.themePreference !== undefined) {
      updateData.themePreference = data.themePreference;
    }

    // Update notification preferences
    if (data.emailNotifications !== undefined) {
      updateData.emailNotifications = data.emailNotifications;
    }

    if (data.pushNotifications !== undefined) {
      updateData.pushNotifications = data.pushNotifications;
    }

    // Update profile
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        subscriptionTier: true,
        themePreference: true,
        emailNotifications: true,
        pushNotifications: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    // Log profile update event for audit trail
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: 'PROFILE_UPDATED',
          userId: user.id,
          email: user.email,
          ipAddress:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            '',
          userAgent: request.headers.get('user-agent') || null,
          details: {
            updatedFields: Object.keys(data),
          },
        },
      });
    } catch (logError) {
      // Non-critical error, continue
      console.warn('Failed to log profile update event:', logError);
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Profile update error:', error);

    if (
      error instanceof Error &&
      error.message.includes('Authentication required')
    ) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

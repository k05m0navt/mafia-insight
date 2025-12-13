import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/apiAuth';
import { formatErrorResponse } from '@/lib/errors';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { logAdminAction } from '@/lib/audit/audit-log';
import { validateNotLastAdmin } from '@/lib/validation/admin-validation';
import { AuditActionType } from '@prisma/client';

const UpdateRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'moderator', 'guest']),
});

/**
 * PATCH /api/admin/users/[id]/role
 * Update user role (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and verify admin role
    const { user: adminUser } = await withAdminAuth(request);

    const { id: userId } = await params;
    const body = await request.json();
    const data = UpdateRoleSchema.parse(body);

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        {
          error: 'User not found',
          message: 'The specified user does not exist',
        },
        { status: 404 }
      );
    }

    // Validate not removing last admin
    await validateNotLastAdmin(userId, data.role);

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: data.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log the role change to audit log
    await logAdminAction({
      actionType: AuditActionType.ROLE_CHANGE,
      adminUserId: adminUser.id,
      targetUserId: userId,
      oldValue: currentUser.role,
      newValue: data.role,
      metadata: {
        adminEmail: adminUser.email,
        targetEmail: currentUser.email,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: 'User role updated successfully',
    });
  } catch (error) {
    console.error('Update user role error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid role value',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      const errorResponse = formatErrorResponse(error);

      // Handle validation errors (last admin protection)
      if (errorResponse.code === 'VALIDATION_ERROR') {
        return NextResponse.json(errorResponse, { status: 400 });
      }

      return NextResponse.json(errorResponse, {
        status:
          errorResponse.code === 'AUTHORIZATION_ERROR'
            ? 403
            : errorResponse.code === 'AUTHENTICATION_ERROR'
              ? 401
              : 500,
      });
    }

    return NextResponse.json(
      {
        error: 'Failed to update user role',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

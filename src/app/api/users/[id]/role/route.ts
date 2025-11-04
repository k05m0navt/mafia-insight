import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/users/user-service';
import { authenticateRequest, requireRole } from '@/lib/apiAuth';
import { z } from 'zod';

// Update role request body schema
const UpdateRoleSchema = z.object({
  role: z.enum(['guest', 'user', 'admin']),
});

/**
 * PUT /api/users/[id]/role
 * Update user role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request - only admins can update roles
    const { user: currentUser, role } = await authenticateRequest(request);
    requireRole(role, 'admin');

    const { id } = await params;
    const body = await request.json();
    const data = UpdateRoleSchema.parse(body);

    // Prevent changing own role
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    const user = await userService.updateUserRole(
      id,
      data.role,
      currentUser.id
    );

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);

    if (
      error instanceof Error &&
      error.message.includes('Authentication required')
    ) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("Role 'admin' required")
    ) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (error.message.includes('admins can')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}

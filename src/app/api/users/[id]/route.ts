import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/users/user-service';
import { authenticateRequest, requireRole } from '@/lib/apiAuth';
import { z } from 'zod';

// Update user request body schema
const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['guest', 'user', 'admin']).optional(),
});

/**
 * GET /api/users/[id]
 * Get a specific user by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request
    const { user, role } = await authenticateRequest(request);

    const { id } = await params;

    // Users can only view their own profile unless they're admin
    if (user.id !== id && role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const userData = await userService.getUserById(id);
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);

    if (
      error instanceof Error &&
      error.message.includes('Authentication required')
    ) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Update a specific user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request
    const { user: currentUser, role } = await authenticateRequest(request);

    const { id } = await params;
    const body = await request.json();
    const data = UpdateUserSchema.parse(body);

    // Users can only update their own profile (name only), unless they're admin
    if (currentUser.id !== id) {
      requireRole(role, 'admin');
    }

    // Only admins can update roles
    if (data.role && data.role !== currentUser.role && role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update user roles' },
        { status: 403 }
      );
    }

    const user = await userService.updateUser(id, {
      name: data.name,
      role: data.role,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);

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

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (error instanceof Error && error.message.includes('admins can')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a specific user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request - only admins can delete users
    const { user: currentUser, role } = await authenticateRequest(request);
    requireRole(role, 'admin');

    const { id } = await params;

    // Prevent self-deletion
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await userService.deleteUser(id, currentUser.id);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);

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

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (error instanceof Error && error.message.includes('admins can')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

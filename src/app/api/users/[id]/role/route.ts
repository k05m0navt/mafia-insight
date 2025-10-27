import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/users/user-service';
import { z } from 'zod';

// Update role request body schema
const UpdateRoleSchema = z.object({
  role: z.enum(['GUEST', 'USER', 'ADMIN']),
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
    const { id } = await params;
    const body = await request.json();
    const data = UpdateRoleSchema.parse(body);

    // TODO: Get current user from session
    const updatedBy = '00000000-0000-0000-0000-000000000000';

    const user = await userService.updateUserRole(id, data.role, updatedBy);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);

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

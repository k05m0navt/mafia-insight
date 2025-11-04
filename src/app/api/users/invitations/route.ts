import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/users/user-service';
import { authenticateRequest, requireRole } from '@/lib/apiAuth';
import { z } from 'zod';

// Create invitation request body schema
const CreateInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['guest', 'user', 'admin']),
});

/**
 * GET /api/users/invitations
 * List all user invitations
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request - only admins can list invitations
    const { role } = await authenticateRequest(request);
    requireRole(role, 'admin');

    // TODO: Implement invitation listing when UserInvitation model is available
    // For now, return empty array as invitations are not yet implemented in the database
    return NextResponse.json({
      invitations: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);

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

    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/invitations
 * Create a new user invitation
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request - only admins can create invitations
    const { user: currentUser, role } = await authenticateRequest(request);
    requireRole(role, 'admin');

    const body = await request.json();
    const data = CreateInvitationSchema.parse(body);

    const invitation = await userService.createInvitation({
      email: data.email,
      role: data.role,
      invitedBy: currentUser.id,
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error('Error creating invitation:', error);

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

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof Error && error.message.includes('admins can')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

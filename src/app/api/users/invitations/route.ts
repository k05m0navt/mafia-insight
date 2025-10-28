import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/users/user-service';
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
export async function GET() {
  try {
    // TODO: Get current user from session and check admin permissions
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
    const body = await request.json();
    const data = CreateInvitationSchema.parse(body);

    // TODO: Get current user from session for audit trail
    const invitedBy = '00000000-0000-0000-0000-000000000000';

    const invitation = await userService.createInvitation({
      email: data.email,
      role: data.role,
      invitedBy,
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error('Error creating invitation:', error);

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

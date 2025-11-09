import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/users/user-service';
import { authenticateRequest, requireRole } from '@/lib/apiAuth';
import { z } from 'zod';

// Query parameters validation schema
const UsersQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default(1),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .default(20),
  search: z.string().optional(),
  role: z.enum(['guest', 'user', 'admin']).optional(),
});

// Create user request body schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['guest', 'user', 'admin']),
});

/**
 * GET /api/users
 * List users with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request - only admins can list all users
    const { role } = await authenticateRequest(request);
    requireRole(role, 'admin');

    const { searchParams } = new URL(request.url);
    const query = UsersQuerySchema.parse(Object.fromEntries(searchParams));

    const result = await userService.searchUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role: query.role,
    });

    return NextResponse.json({
      users: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching users:', error);

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
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request - only admins can create users
    const { user: currentUser, role } = await authenticateRequest(request);
    requireRole(role, 'admin');

    const body = await request.json();
    const data = CreateUserSchema.parse(body);

    const user = await userService.createUser({
      email: data.email,
      name: data.name,
      role: data.role,
      invitedBy: currentUser.id,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);

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
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes('admins can')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

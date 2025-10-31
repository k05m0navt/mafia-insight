import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import {
  getAllUsers,
  createAdmin,
  getUserStats,
} from '@/services/auth/adminService';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Create admin schema
const CreateAdminSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Check if requesting stats or full list
    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const stats = await getUserStats();
      return NextResponse.json(stats);
    }

    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create new admin user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = CreateAdminSchema.parse(body);

    const newAdmin = await createAdmin({
      email: data.email,
      name: data.name,
      password: data.password,
    });

    return NextResponse.json({
      success: true,
      user: newAdmin,
      message: 'Admin user created successfully',
    });
  } catch (error) {
    console.error('Create admin error:', error);

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
      {
        error:
          error instanceof Error ? error.message : 'Failed to create admin',
      },
      { status: 500 }
    );
  }
}

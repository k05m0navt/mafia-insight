import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const BootstrapAdminSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
});

/**
 * POST /api/admin/bootstrap
 * Create the first admin user when no admins exist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = BootstrapAdminSchema.parse(body);

    // Check if any admin users exist
    const adminCount = await prisma.user.count({
      where: { role: 'admin' },
    });

    if (adminCount > 0) {
      return NextResponse.json(
        {
          error:
            'Admin users already exist. Use the regular user creation endpoint.',
        },
        { status: 400 }
      );
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create the first admin user
    const adminUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: 'admin',
        subscriptionTier: 'PREMIUM',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: 'First admin user created successfully',
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating first admin:', error);

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
    }

    return NextResponse.json(
      { error: 'Failed to create first admin user' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/bootstrap
 * Check if admin bootstrap is needed
 */
export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'admin' },
    });

    return NextResponse.json({
      needsBootstrap: adminCount === 0,
      adminCount,
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 }
    );
  }
}

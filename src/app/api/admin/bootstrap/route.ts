import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Bootstrap schema
const BootstrapSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * POST /api/admin/bootstrap
 * Create the first admin user (only works if no admins exist)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if any admin users already exist
    const existingAdmins = await prisma.user.count({
      where: { role: 'admin' },
    });

    if (existingAdmins > 0) {
      return NextResponse.json(
        {
          error: 'Admin users already exist. Bootstrap is no longer available.',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const data = BootstrapSchema.parse(body);

    // Initialize Supabase client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto-confirm email for first admin
        user_metadata: {
          name: data.name,
        },
      });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create admin user' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create admin user' },
        { status: 500 }
      );
    }

    // Create user profile in database with admin role
    const profile = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: 'admin',
        subscriptionTier: 'FREE',
        themePreference: 'light',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'First admin user created successfully',
      user: profile,
    });
  } catch (error) {
    console.error('Bootstrap error:', error);

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
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}

import { prisma } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin Service
 * Handles user management operations for administrators
 */

export interface CreateAdminData {
  email: string;
  name: string;
  password: string;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: string;
  subscriptionTier: string;
  createdAt: Date;
  lastLogin?: Date | null;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw new Error('Failed to fetch users');
  }
}

/**
 * Create a new admin user
 */
export async function createAdmin(data: CreateAdminData): Promise<UserData> {
  try {
    // Initialize Supabase client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

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
        email_confirm: true,
        user_metadata: {
          name: data.name,
        },
      });

    if (authError) {
      throw new Error(
        authError.message || 'Failed to create user in auth system'
      );
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
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
        avatar: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return profile;
  } catch (error) {
    console.error('Failed to create admin:', error);
    throw error;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  role: 'guest' | 'user' | 'moderator' | 'admin'
): Promise<UserData> {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('Failed to update user role:', error);
    throw new Error('Failed to update user role');
  }
}

/**
 * Delete user (soft delete by setting role to guest)
 */
export async function deactivateUser(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'guest' },
    });
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    throw new Error('Failed to deactivate user');
  }
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  try {
    const [totalUsers, adminCount, moderatorCount, activeUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'admin' } }),
        prisma.user.count({ where: { role: 'moderator' } }),
        prisma.user.count({
          where: {
            lastLogin: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

    return {
      totalUsers,
      adminCount,
      moderatorCount,
      activeUsers,
    };
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    throw new Error('Failed to fetch user stats');
  }
}

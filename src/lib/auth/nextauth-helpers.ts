import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

/**
 * Get the current NextAuth session on the server
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Create a NextAuth session after email verification
 * This is called after a user verifies their email to establish a NextAuth session
 */
export async function createSessionAfterVerification(userId: string) {
  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // Verify user's email is confirmed in Supabase
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser || !supabaseUser.email_confirmed_at) {
      return null;
    }

    // Return user data that can be used to create a NextAuth session
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.avatar || undefined,
    };
  } catch (error) {
    console.error('[NextAuth Helper] Error creating session:', error);
    return null;
  }
}

/**
 * Check if user has a valid NextAuth session
 */
export async function hasValidSession(): Promise<boolean> {
  const session = await getSession();
  return !!session && !!session.user;
}

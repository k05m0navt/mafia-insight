import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/nextauth-helpers';
import { prisma } from '@/lib/db';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { PageTransition } from '@/components/layout/PageTransition';

export const metadata: Metadata = {
  title: 'Profile | Mafia Insight',
  description: 'View and manage your profile information and preferences',
};

export default async function ProfilePage() {
  // Get authenticated user from NextAuth session (works with OAuth)
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login?redirect=/profile');
  }

  // Get user profile from database
  const userProfile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      subscriptionTier: true,
      themePreference: true,
      emailNotifications: true,
      pushNotifications: true,
      createdAt: true,
      lastLogin: true,
    },
  });

  if (!userProfile) {
    // Create profile if it doesn't exist
    const newProfile = await prisma.user.create({
      data: {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || 'User',
        role: 'user',
        subscriptionTier: 'FREE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        subscriptionTier: true,
        themePreference: true,
        emailNotifications: true,
        pushNotifications: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return (
      <PageTransition>
        <ProfileLayout user={newProfile} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <ProfileLayout user={userProfile} />
    </PageTransition>
  );
}

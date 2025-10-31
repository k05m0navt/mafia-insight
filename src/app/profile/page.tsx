import { Metadata } from 'next';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Profile | Mafia Insight',
  description: 'View and edit your profile',
};

export default async function ProfilePage() {
  // Get authenticated user
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login?redirect=/profile');
  }

  // Get user profile from database
  const userProfile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      subscriptionTier: true,
      themePreference: true,
      createdAt: true,
      lastLogin: true,
    },
  });

  if (!userProfile) {
    // Create profile if it doesn't exist
    const newProfile = await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || 'User',
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
        createdAt: true,
        lastLogin: true,
      },
    });

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ProfileHeader user={newProfile} />
        <div className="mt-8">
          <ProfileEditor user={newProfile} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProfileHeader user={userProfile} />
      <div className="mt-8">
        <ProfileEditor user={userProfile} />
      </div>
    </div>
  );
}

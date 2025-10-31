import { Metadata } from 'next';
import { UserManagement } from '@/components/admin/UserManagement';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'User Management | Admin | Mafia Insight',
  description: 'Manage users and administrators',
};

export default async function AdminUsersPage() {
  // Get authenticated user
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login?redirect=/admin/users');
  }

  // Check if user is admin
  const userProfile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true },
  });

  if (userProfile?.role !== 'admin') {
    redirect('/access-denied');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage user accounts, create administrators, and monitor user activity
        </p>
      </div>
      <UserManagement />
    </div>
  );
}

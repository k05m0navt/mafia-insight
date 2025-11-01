'use client';

import { UserManagement } from '@/components/admin/UserManagement';

export default function AdminUsersPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage user accounts, create administrators, and monitor user activity
        </p>
      </div>
      <UserManagement />
    </>
  );
}

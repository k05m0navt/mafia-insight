'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRole } from '@/hooks/useRole';
import { ProtectedRoute } from '@/components/protected/ProtectedRoute';
import { Permission, PermissionUpdate } from '@/types/permissions';
import { permissionService } from '@/lib/permissions';

export default function PermissionsPage() {
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const { isAdmin, isLoading: _roleLoading } = useRole();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await permissionService.getAllPermissions();
      setPermissions(data);
    } catch (err) {
      setError('Failed to load permissions');
      console.error('Error loading permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionUpdate = async (
    permissionId: string,
    roles: string[]
  ) => {
    try {
      setError(null);
      setSuccess(null);

      const update: PermissionUpdate = {
        id: permissionId,
        roles,
      };

      const result = await permissionService.updatePermissions([update]);
      setSuccess('Permissions updated successfully');

      // Update state immediately with returned permissions if available
      if (result?.permissions) {
        setPermissions(result.permissions);
      } else {
        // Fallback: reload permissions if response doesn't include them
        await loadPermissions();
      }

      // Dispatch event to notify other parts of the app that permissions were updated
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('permissions-updated'));
      }
    } catch (err) {
      setError('Failed to update permissions');
      console.error('Error updating permissions:', err);
      // Reload permissions on error to ensure state is in sync
      await loadPermissions();
    }
  };

  const handleRoleToggle = (
    permissionId: string,
    role: string,
    currentRoles: string[]
  ) => {
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];

    handlePermissionUpdate(permissionId, newRoles);
  };

  // Show loading state while checking permissions
  // Note: AdminOnly already handles auth loading, so we only need to wait for permissions
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="mx-auto w-8 h-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-primary border-t-transparent"></div>
          </div>
          <p className="text-sm text-muted-foreground">
            Loading permissions...
          </p>
        </div>
      </div>
    );
  }

  // Check permissions - if admin, allow access; otherwise check permission
  const hasAccess = isAdmin || hasPermission('admin:permissions');

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['admin:permissions']}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Permission Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage page access permissions for different user roles.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 rounded">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading permissions...
          </span>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Guest
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {permissions.map((permission) => (
                    <tr key={permission.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {permission.resource}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {permission.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={permission.roles.includes('admin')}
                          onChange={() =>
                            handleRoleToggle(
                              permission.id,
                              'admin',
                              permission.roles
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={permission.roles.includes('user')}
                          onChange={() =>
                            handleRoleToggle(
                              permission.id,
                              'user',
                              permission.roles
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={permission.roles.includes('guest')}
                          onChange={() =>
                            handleRoleToggle(
                              permission.id,
                              'guest',
                              permission.roles
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

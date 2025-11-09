'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  // Track pending updates to prevent race conditions
  const pendingUpdatesRef = useRef<Map<string, string[]>>(new Map());
  const updateQueueRef = useRef<Map<string, Promise<void>>>(new Map());

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

  const handlePermissionUpdate = useCallback(
    async (permissionId: string, roles: string[]): Promise<void> => {
      // Store the pending update
      pendingUpdatesRef.current.set(permissionId, roles);

      // Mark this permission as updating
      setUpdating((prev) => new Set(prev).add(permissionId));

      try {
        setError(null);
        setSuccess(null);

        const update: PermissionUpdate = {
          id: permissionId,
          roles,
        };

        // Save to database immediately
        console.log(
          `[Permissions] Saving permission ${permissionId} with roles:`,
          roles
        );
        const result = await permissionService.updatePermissions([update]);
        console.log(
          `[Permissions] Permission ${permissionId} saved successfully`
        );

        // Check if there's a newer pending update for this permission
        const latestPending = pendingUpdatesRef.current.get(permissionId);
        const isLatestUpdate = latestPending === roles;

        // Always update state, but merge intelligently to preserve concurrent updates
        setPermissions((prevPermissions) => {
          // Create a map of current permissions for quick lookup
          const currentMap = new Map(prevPermissions.map((p) => [p.id, p]));

          if (result?.permissions) {
            // Merge API response with current state
            // Only update the permission that was changed, keep others as-is
            result.permissions.forEach((apiPerm: Permission) => {
              if (apiPerm.id === permissionId) {
                // Update the permission that was changed
                currentMap.set(apiPerm.id, {
                  ...apiPerm,
                  roles: apiPerm.roles, // Use API response roles
                  updatedAt: apiPerm.updatedAt || new Date(),
                });
              } else {
                // For other permissions, keep current state (preserve optimistic updates)
                if (!currentMap.has(apiPerm.id)) {
                  // If new permission appears in API but not in current state, add it
                  currentMap.set(apiPerm.id, apiPerm);
                }
                // Otherwise, keep the current state to preserve any pending optimistic updates
              }
            });
          } else {
            // If no permissions returned, just update the specific permission in state
            const currentPerm = currentMap.get(permissionId);
            if (currentPerm) {
              currentMap.set(permissionId, {
                ...currentPerm,
                roles,
                updatedAt: new Date(),
              });
            }
          }

          return Array.from(currentMap.values());
        });

        // Only show success if this was the latest update
        if (isLatestUpdate) {
          setSuccess('Permissions updated successfully');
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccess((prev) =>
              prev === 'Permissions updated successfully' ? null : prev
            );
          }, 3000);
        }

        // Remove from pending updates if this was the latest
        if (isLatestUpdate) {
          pendingUpdatesRef.current.delete(permissionId);
        }

        // Dispatch event to notify other parts of the app that permissions were updated
        // Use a CustomEvent with detail to ensure it's properly handled
        if (typeof window !== 'undefined') {
          console.log('[Permissions] Dispatching permissions-updated event');
          window.dispatchEvent(
            new CustomEvent('permissions-updated', {
              detail: { permissionId, timestamp: Date.now() },
            })
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update permissions';
        setError(errorMessage);
        console.error('Error updating permissions:', err);

        // On error, revert the optimistic update by reloading
        // But do it silently without showing loading state
        try {
          const data = await permissionService.getAllPermissions();
          setPermissions(data);
        } catch (reloadErr) {
          console.error(
            'Error reloading permissions after update failure:',
            reloadErr
          );
        }

        // Remove from pending updates on error
        pendingUpdatesRef.current.delete(permissionId);
      } finally {
        // Remove from updating set
        setUpdating((prev) => {
          const next = new Set(prev);
          next.delete(permissionId);
          return next;
        });

        // Remove from update queue
        updateQueueRef.current.delete(permissionId);
      }
    },
    []
  );

  const handleRoleToggle = useCallback(
    async (permissionId: string, role: string, currentRoles: string[]) => {
      // Prevent multiple simultaneous updates for the same permission
      if (updating.has(permissionId)) {
        // If there's already an update in progress, queue this one
        // Wait for the current update to complete
        const existingUpdate = updateQueueRef.current.get(permissionId);
        if (existingUpdate) {
          await existingUpdate;
        }
      }

      const newRoles = currentRoles.includes(role)
        ? currentRoles.filter((r) => r !== role)
        : [...currentRoles, role];

      // Optimistically update the UI immediately
      setPermissions((prevPermissions) =>
        prevPermissions.map((perm) =>
          perm.id === permissionId ? { ...perm, roles: newRoles } : perm
        )
      );

      // Create and track the update promise
      const updatePromise = handlePermissionUpdate(permissionId, newRoles);
      updateQueueRef.current.set(permissionId, updatePromise);

      // Then update in the database (this will update state again with API response)
      await updatePromise;
    },
    [handlePermissionUpdate, updating]
  );

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
                          disabled={updating.has(permission.id)}
                          onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRoleToggle(
                              permission.id,
                              'admin',
                              permission.roles
                            );
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={permission.roles.includes('user')}
                          disabled={updating.has(permission.id)}
                          onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRoleToggle(
                              permission.id,
                              'user',
                              permission.roles
                            );
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={permission.roles.includes('guest')}
                          disabled={updating.has(permission.id)}
                          onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRoleToggle(
                              permission.id,
                              'guest',
                              permission.roles
                            );
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

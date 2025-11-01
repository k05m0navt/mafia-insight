import { useState, useEffect } from 'react';
import { authService } from '@/services/AuthService';
import { permissionService } from '@/lib/permissions';
import { Permission as ApiPermission } from '@/types/permissions';

export interface Permission {
  canAccessPage: (page: string) => boolean;
  canPerformAction: (action: string) => boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isLoading: boolean;
}

// Cache for API permissions
let permissionsCache: ApiPermission[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to check if a user role has access to a resource:action based on API permissions
function hasResourceActionPermission(
  apiPermissions: ApiPermission[],
  userRole: string,
  resource: string,
  action: string
): boolean {
  const permission = apiPermissions.find(
    (p) => p.resource === resource && p.action === action
  );
  return permission ? permission.roles.includes(userRole) : false;
}

// Helper to check permission string like "action:resource" (e.g., "admin:permissions")
function checkPermissionString(
  apiPermissions: ApiPermission[],
  userRole: string,
  permissionString: string
): boolean {
  const [action, resource] = permissionString.split(':');
  if (!action || !resource) return false;

  // Special handling for admin:permissions - check if user has admin:admin permission
  if (resource === 'permissions' && action === 'admin') {
    return hasResourceActionPermission(
      apiPermissions,
      userRole,
      'admin',
      'admin'
    );
  }

  // For other permissions, check the actual resource:action
  return hasResourceActionPermission(
    apiPermissions,
    userRole,
    resource,
    action
  );
}

export function usePermissions(): Permission {
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission>({
    canAccessPage: () => false,
    canPerformAction: () => false,
    hasRole: () => false,
    hasPermission: () => false,
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
    isLoading: true,
  });

  useEffect(() => {
    const updatePermissions = async () => {
      try {
        setIsLoading(true);
        const user = await authService.getCurrentUser();

        // Use 'guest' role when user is null (for unauthenticated users)
        const userRole = user?.role || 'guest';

        if (!user) {
          // For guests, we still need to fetch and check permissions
          // Don't return early - continue to check permissions for guest role
        }

        // Fetch permissions from API (with caching)
        // Note: For guests, this will return empty array and use fallback permissions
        const now = Date.now();
        if (!permissionsCache || now - cacheTimestamp > CACHE_DURATION) {
          try {
            permissionsCache = await permissionService.getAllPermissions();
            cacheTimestamp = now;
          } catch (_error) {
            // Silently handle errors - permission service already handles 401/403 gracefully
            // Just set empty array to use hardcoded fallbacks
            permissionsCache = [];
          }
        }

        const apiPermissions = permissionsCache || [];

        // Map pages to resource:action permissions
        const pageToPermission: Record<
          string,
          { resource: string; action: string }
        > = {
          '/admin': { resource: 'admin', action: 'read' },
          '/admin/permissions': { resource: 'admin', action: 'admin' },
          '/admin/users': { resource: 'admin', action: 'admin' },
          '/moderate': { resource: 'admin', action: 'write' },
          '/profile': { resource: 'users', action: 'read' },
          '/settings': { resource: 'users', action: 'read' },
          '/players': { resource: 'players', action: 'read' },
          '/tournaments': { resource: 'tournaments', action: 'read' },
          '/clubs': { resource: 'clubs', action: 'read' },
          '/games': { resource: 'games', action: 'read' },
        };

        setPermissions({
          isLoading: false,
          canAccessPage: (page: string) => {
            const perm = pageToPermission[page];
            if (!perm) {
              // Default: allow if not explicitly restricted
              return true;
            }

            // Admin users should always have access to all pages
            if (userRole === 'admin') {
              return true;
            }

            return hasResourceActionPermission(
              apiPermissions,
              userRole,
              perm.resource,
              perm.action
            );
          },
          canPerformAction: (action: string) => {
            // Parse action string like "delete:user" -> resource: "users", action: "delete"
            // or "read:players" -> resource: "players", action: "read"
            const parts = action.split(':');
            if (parts.length === 2) {
              const [actionPart, resourcePart] = parts;
              return hasResourceActionPermission(
                apiPermissions,
                userRole,
                resourcePart,
                actionPart
              );
            }
            // Fallback to hardcoded rules for backward compatibility
            const actionPermissions: Record<string, string[]> = {
              'delete:user': ['admin'],
              'moderate:content': ['admin', 'moderator'],
              'view:analytics': ['admin'],
              'edit:profile': ['admin', 'user', 'moderator'],
            };
            const requiredRoles = actionPermissions[action] || [];
            return requiredRoles.includes(userRole);
          },
          hasRole: (role: string) => {
            return userRole === role;
          },
          hasPermission: (permission: string) => {
            // Special case: if user is admin and permission check fails, allow admin:permissions and admin:admin
            // This ensures admins can always access admin pages even if API permissions aren't loaded yet
            if (
              userRole === 'admin' &&
              (permission === 'admin:permissions' ||
                permission === 'admin:admin')
            ) {
              // Check API permissions first if available
              if (apiPermissions.length > 0) {
                const hasPermission = checkPermissionString(
                  apiPermissions,
                  userRole,
                  permission
                );
                // If API check fails but user is admin, allow it (fallback)
                if (!hasPermission) {
                  return true; // Admin role should always have admin:permissions access
                }
                return hasPermission;
              }
              // If API not loaded yet, allow admin access
              return true;
            }

            // Check API permissions first
            if (apiPermissions.length > 0) {
              return checkPermissionString(
                apiPermissions,
                userRole,
                permission
              );
            }
            // Fallback to hardcoded rules
            const permissionRules: Record<string, string[]> = {
              'admin:permissions': ['admin'],
              'admin:users': ['admin'],
              'admin:admin': ['admin'],
              'read:players': ['user', 'admin', 'guest'],
              'write:players': ['admin'],
              'admin:players': ['admin'],
              'read:tournaments': ['user', 'admin', 'guest'],
              'write:tournaments': ['admin'],
              'read:clubs': ['user', 'admin', 'guest'],
              'write:clubs': ['admin'],
              'read:games': ['user', 'admin', 'guest'],
              'write:games': ['admin'],
              'moderate:content': ['admin', 'moderator'],
              'view:analytics': ['admin'],
              'edit:profile': ['admin', 'user', 'moderator'],
            };
            const requiredRoles = permissionRules[permission] || [];
            return requiredRoles.includes(userRole);
          },
          hasAnyPermission: (permissions: string[]) => {
            return permissions.some((permission) => {
              if (apiPermissions.length > 0) {
                return checkPermissionString(
                  apiPermissions,
                  userRole,
                  permission
                );
              }
              // Fallback
              const permissionRules: Record<string, string[]> = {
                'admin:permissions': ['admin'],
                'admin:users': ['admin'],
                'admin:admin': ['admin'],
                'read:players': ['user', 'admin', 'guest'],
                'write:players': ['admin'],
                'moderate:content': ['admin', 'moderator'],
                'view:analytics': ['admin'],
                'edit:profile': ['admin', 'user', 'moderator'],
              };
              const requiredRoles = permissionRules[permission] || [];
              return requiredRoles.includes(userRole);
            });
          },
          hasAllPermissions: (permissions: string[]) => {
            return permissions.every((permission) => {
              if (apiPermissions.length > 0) {
                return checkPermissionString(
                  apiPermissions,
                  userRole,
                  permission
                );
              }
              // Fallback
              const permissionRules: Record<string, string[]> = {
                'admin:permissions': ['admin'],
                'admin:users': ['admin'],
                'admin:admin': ['admin'],
                'read:players': ['user', 'admin', 'guest'],
                'write:players': ['admin'],
                'moderate:content': ['admin', 'moderator'],
                'view:analytics': ['admin'],
                'edit:profile': ['admin', 'user', 'moderator'],
              };
              const requiredRoles = permissionRules[permission] || [];
              return requiredRoles.includes(userRole);
            });
          },
        });
      } catch (error) {
        console.error('Error updating permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    updatePermissions();

    // Listen for authentication changes
    const interval = setInterval(updatePermissions, 30000); // Check every 30 seconds instead of 1 second
    // Also listen for permission updates (when admin changes permissions)
    const handlePermissionUpdate = () => {
      permissionsCache = null; // Invalidate cache
      updatePermissions();
    };
    window.addEventListener('permissions-updated', handlePermissionUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('permissions-updated', handlePermissionUpdate);
    };
  }, []);

  return {
    ...permissions,
    isLoading,
  };
}

export default usePermissions;

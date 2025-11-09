import { useState, useEffect } from 'react';
import { authService } from '@/services/AuthService';
import { permissionService } from '@/lib/permissions';
import { Permission as ApiPermission } from '@/types/permissions';

declare global {
  interface Window {
    clearPermissionsCache?: () => void;
  }
}

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

// Function to force clear cache (useful for debugging)
if (typeof window !== 'undefined') {
  window.clearPermissionsCache = () => {
    permissionsCache = null;
    cacheTimestamp = 0;
    console.log('[Permissions] Cache cleared manually');
    window.dispatchEvent(
      new CustomEvent('permissions-updated', {
        detail: { manual: true, timestamp: Date.now() },
      })
    );
  };
}

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

  if (!permission) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Permissions] Permission not found:', {
        resource,
        action,
        availablePermissions: apiPermissions.map(
          (p) => `${p.resource}:${p.action}`
        ),
      });
    }
    return false;
  }

  // Ensure roles is an array and handle case-insensitive comparison
  const rolesArray = Array.isArray(permission.roles) ? permission.roles : [];

  // Normalize role comparison (case-insensitive, trimmed)
  const normalizedUserRole = userRole?.toLowerCase().trim() || '';
  const hasAccess = rolesArray.some(
    (role) => role?.toLowerCase().trim() === normalizedUserRole
  );

  if (process.env.NODE_ENV === 'development') {
    console.log('[Permissions] Permission check:', {
      resource,
      action,
      userRole,
      normalizedUserRole,
      permissionRoles: permission.roles,
      rolesArray,
      hasAccess,
      rolesType: typeof permission.roles,
      rolesIsArray: Array.isArray(permission.roles),
    });
  }

  return hasAccess;
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

  // Helper to get user role from cookies (fast, no API call needed)
  const getUserRoleFromCookies = (): string => {
    if (typeof document === 'undefined') return 'guest';

    // Check user-role cookie first (fastest method)
    const roleCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('user-role='))
      ?.split('=')[1];

    if (roleCookie) {
      return roleCookie.toLowerCase();
    }

    // Fallback: check auth-token cookie to determine if user is authenticated
    const authToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth-token='))
      ?.split('=')[1];

    // If no auth token, definitely a guest
    if (!authToken) {
      return 'guest';
    }

    // If auth token exists but no role cookie, default to 'user'
    // (will be updated when full user data is fetched)
    return 'user';
  };

  useEffect(() => {
    const updatePermissions = async (_showLoading: boolean = true) => {
      try {
        // Get role from cookies immediately (fast, no API call)
        // This allows us to check permissions without waiting for Supabase
        const userRoleFromCookies = getUserRoleFromCookies();

        // For guests, use cookie-based role immediately and skip API call
        // For authenticated users, we can still use cookie role while fetching full data
        const userRole = userRoleFromCookies;

        // Set permissions immediately with cookie-based role (non-blocking)
        // This allows pages to render while we fetch full user data in background
        const setPermissionsImmediate = (role: string) => {
          // Fetch permissions from cache or API (with caching)
          const now = Date.now();
          // Check cache first
          const apiPermissions = permissionsCache || [];

          // If cache is valid, use it immediately
          if (
            permissionsCache &&
            cacheTimestamp > 0 &&
            now - cacheTimestamp <= CACHE_DURATION
          ) {
            // Use cached permissions immediately
          } else {
            // Start fetching permissions in background (non-blocking)
            permissionService
              .getAllPermissions()
              .then((perms) => {
                permissionsCache = perms;
                cacheTimestamp = now;
                console.log(
                  `[Permissions] Loaded ${perms.length} permissions (background)`
                );
              })
              .catch((error) => {
                console.warn(
                  '[Permissions] Failed to fetch permissions, using fallback:',
                  error
                );
                permissionsCache = [];
                cacheTimestamp = now;
              });
          }

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

          // Create permission functions with current role and permissions
          const createPermissionFunctions = (
            currentRole: string,
            currentApiPermissions: ApiPermission[]
          ) => ({
            isLoading: false,
            canAccessPage: (page: string) => {
              const perm = pageToPermission[page];
              if (!perm) {
                return true;
              }

              if (currentRole === 'admin') {
                return true;
              }

              if (currentApiPermissions.length > 0) {
                const hasPermission = hasResourceActionPermission(
                  currentApiPermissions,
                  currentRole,
                  perm.resource,
                  perm.action
                );

                if (hasPermission) {
                  return true;
                }
              }

              // Fallback to hardcoded rules
              const fallbackPermissions: Record<string, string[]> = {
                'read:players': ['user', 'admin', 'guest'],
                'read:tournaments': ['user', 'admin', 'guest'],
                'read:clubs': ['user', 'admin', 'guest'],
                'read:games': ['user', 'admin', 'guest'],
                'read:admin': ['admin'],
                'admin:admin': ['admin'],
              };

              const permissionKey = `${perm.action}:${perm.resource}`;
              const allowedRoles = fallbackPermissions[permissionKey] || [];
              return allowedRoles.includes(currentRole);
            },
            canPerformAction: (action: string) => {
              const parts = action.split(':');
              if (parts.length === 2) {
                const [actionPart, resourcePart] = parts;
                if (currentApiPermissions.length > 0) {
                  return hasResourceActionPermission(
                    currentApiPermissions,
                    currentRole,
                    resourcePart,
                    actionPart
                  );
                }
                // Fallback to hardcoded rules
                const actionPermissions: Record<string, string[]> = {
                  'delete:user': ['admin'],
                  'moderate:content': ['admin', 'moderator'],
                  'view:analytics': ['admin'],
                  'edit:profile': ['admin', 'user', 'moderator'],
                };
                const requiredRoles = actionPermissions[action] || [];
                return requiredRoles.includes(currentRole);
              }
              return false;
            },
            hasRole: (role: string) => currentRole === role,
            hasPermission: (permission: string) => {
              if (
                currentRole === 'admin' &&
                (permission === 'admin:permissions' ||
                  permission === 'admin:admin')
              ) {
                return true;
              }
              if (currentApiPermissions.length > 0) {
                return checkPermissionString(
                  currentApiPermissions,
                  currentRole,
                  permission
                );
              }
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
              };
              const requiredRoles = permissionRules[permission] || [];
              return requiredRoles.includes(currentRole);
            },
            hasAnyPermission: (permissions: string[]) => {
              return permissions.some((permission) => {
                if (currentApiPermissions.length > 0) {
                  return checkPermissionString(
                    currentApiPermissions,
                    currentRole,
                    permission
                  );
                }
                const permissionRules: Record<string, string[]> = {
                  'read:players': ['user', 'admin', 'guest'],
                  'write:players': ['admin'],
                };
                const requiredRoles = permissionRules[permission] || [];
                return requiredRoles.includes(currentRole);
              });
            },
            hasAllPermissions: (permissions: string[]) => {
              return permissions.every((permission) => {
                if (currentApiPermissions.length > 0) {
                  return checkPermissionString(
                    currentApiPermissions,
                    currentRole,
                    permission
                  );
                }
                const permissionRules: Record<string, string[]> = {
                  'read:players': ['user', 'admin', 'guest'],
                  'write:players': ['admin'],
                };
                const requiredRoles = permissionRules[permission] || [];
                return requiredRoles.includes(currentRole);
              });
            },
          });

          // Set permissions immediately with cookie-based role
          setPermissions(createPermissionFunctions(role, apiPermissions));

          // Set loading to false immediately for guests
          if (role === 'guest') {
            setIsLoading(false);
          }
        };

        // Set permissions immediately with cookie role (non-blocking)
        setPermissionsImmediate(userRole);

        // Only fetch full user data if we have an auth token (lazy loading, non-blocking)
        // This prevents Supabase calls for guests
        if (userRoleFromCookies !== 'guest') {
          // Fetch user data in background (non-blocking)
          authService
            .getCurrentUser()
            .then((fetchedUser) => {
              if (fetchedUser?.role && fetchedUser.role !== userRole) {
                // Update permissions with correct role if it changed
                setPermissionsImmediate(fetchedUser.role);
              }
            })
            .catch((error) => {
              // If user fetch fails, cookie-based role is already set
              console.warn(
                '[Permissions] Failed to fetch user, using cookie role:',
                error
              );
            })
            .finally(() => {
              setIsLoading(false);
            });
        } else {
          // For guests, we're already done
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error updating permissions:', error);
        setIsLoading(false);
      }
    };

    updatePermissions();

    // Listen for authentication changes
    const interval = setInterval(updatePermissions, 30000); // Check every 30 seconds instead of 1 second
    // Also listen for permission updates (when admin changes permissions)
    const handlePermissionUpdate = (event: Event) => {
      console.log('[Permissions] Received permissions-updated event', event);
      // Fully invalidate cache by clearing both cache and timestamp
      permissionsCache = null;
      cacheTimestamp = 0; // Reset timestamp to force immediate refresh
      // Force immediate refresh by calling updatePermissions
      // This will bypass the cache check since cacheTimestamp is 0
      updatePermissions(false); // Update silently without showing loading state
    };

    // Listen for the event - use capture phase to ensure we catch it
    window.addEventListener(
      'permissions-updated',
      handlePermissionUpdate,
      true
    );

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        'permissions-updated',
        handlePermissionUpdate,
        true
      );
    };
  }, []);

  return {
    ...permissions,
    isLoading,
  };
}

export default usePermissions;

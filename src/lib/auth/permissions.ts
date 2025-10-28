import type { UserRole } from '@/types/navigation';
import { roleHierarchy } from './roles';

/**
 * Resource types that can be protected
 */
export type Resource =
  | 'users'
  | 'players'
  | 'clubs'
  | 'tournaments'
  | 'games'
  | 'analytics'
  | 'admin';

/**
 * Action types that can be performed on resources
 */
export type Action = 'read' | 'write' | 'delete' | 'admin';

/**
 * Permission definition
 */
export interface Permission {
  resource: Resource;
  action: Action;
  role: UserRole;
  conditions?: Record<string, unknown>;
}

/**
 * Default permission matrix
 * Defines what actions each role can perform on each resource
 */
const permissionMatrix: Record<UserRole, Record<Resource, Action[]>> = {
  guest: {
    users: [],
    players: ['read'],
    clubs: ['read'],
    tournaments: ['read'],
    games: ['read'],
    analytics: [],
    admin: [],
  },
  user: {
    users: ['read'],
    players: ['read'],
    clubs: ['read'],
    tournaments: ['read'],
    games: ['read'],
    analytics: ['read'],
    admin: [],
  },
  moderator: {
    users: ['read', 'write'],
    players: ['read', 'write'],
    clubs: ['read', 'write'],
    tournaments: ['read', 'write'],
    games: ['read', 'write'],
    analytics: ['read'],
    admin: [],
  },
  admin: {
    users: ['read', 'write', 'delete', 'admin'],
    players: ['read', 'write', 'delete', 'admin'],
    clubs: ['read', 'write', 'delete', 'admin'],
    tournaments: ['read', 'write', 'delete', 'admin'],
    games: ['read', 'write', 'delete', 'admin'],
    analytics: ['read', 'write', 'admin'],
    admin: ['read', 'write', 'delete', 'admin'],
  },
};

/**
 * Check if a user role can perform an action on a resource
 */
export function canPerformAction(
  userRole: UserRole,
  resource: Resource,
  action: Action
): boolean {
  const allowedActions = permissionMatrix[userRole]?.[resource] || [];
  return allowedActions.includes(action);
}

/**
 * Check if a user role can read a resource
 */
export function canRead(userRole: UserRole, resource: Resource): boolean {
  return canPerformAction(userRole, resource, 'read');
}

/**
 * Check if a user role can write to a resource
 */
export function canWrite(userRole: UserRole, resource: Resource): boolean {
  return canPerformAction(userRole, resource, 'write');
}

/**
 * Check if a user role can delete a resource
 */
export function canDelete(userRole: UserRole, resource: Resource): boolean {
  return canPerformAction(userRole, resource, 'delete');
}

/**
 * Check if a user role has admin access to a resource
 */
export function hasAdminAccess(
  userRole: UserRole,
  resource: Resource
): boolean {
  return canPerformAction(userRole, resource, 'admin');
}

/**
 * Get all actions a user role can perform on a resource
 */
export function getAllowedActions(
  userRole: UserRole,
  resource: Resource
): Action[] {
  return permissionMatrix[userRole]?.[resource] || [];
}

/**
 * Check if a user role can access admin features
 */
export function canAccessAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

/**
 * Get resources accessible by a user role
 */
export function getAccessibleResources(userRole: UserRole): Resource[] {
  const resources: Resource[] = [];

  for (const resource of Object.keys(
    permissionMatrix[userRole]
  ) as Resource[]) {
    const actions = permissionMatrix[userRole][resource];
    if (actions.length > 0) {
      resources.push(resource);
    }
  }

  return resources;
}

/**
 * Check if a role has at least the required permissions for an action
 */
export function hasRolePermission(
  userRole: UserRole,
  requiredRole: UserRole,
  resource: Resource,
  action: Action
): boolean {
  // Check if user role meets minimum level
  if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
    return false;
  }

  // Check specific permission
  return canPerformAction(userRole, resource, action);
}

/**
 * Require specific permission or throw error
 */
export function requirePermission(
  userRole: UserRole,
  resource: Resource,
  action: Action
): void {
  if (!canPerformAction(userRole, resource, action)) {
    throw new Error(
      `Insufficient permissions: ${userRole} cannot ${action} ${resource}`
    );
  }
}

/**
 * Check if user can manage another user based on roles
 */
export function canManageUser(
  managerRole: UserRole,
  targetRole: UserRole
): boolean {
  // Users can manage themselves, but need higher role to manage others
  if (managerRole === targetRole) {
    return true;
  }

  // Admin can manage anyone
  if (managerRole === 'admin') {
    return targetRole !== 'admin';
  }

  // Users and guests cannot manage others
  return false;
}

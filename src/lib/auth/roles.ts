import type { UserRole } from '@/types/navigation';

/**
 * Role hierarchy for access control
 * Lower number = less privileges, higher number = more privileges
 */
export const roleHierarchy: Record<UserRole, number> = {
  guest: 0,
  user: 1,
  moderator: 1.5,
  admin: 2,
};

/**
 * Role display names
 */
export const roleDisplayNames: Record<UserRole, string> = {
  guest: 'Guest',
  user: 'User',
  moderator: 'Moderator',
  admin: 'Administrator',
};

/**
 * Role descriptions
 */
export const roleDescriptions: Record<UserRole, string> = {
  guest: 'Can view public content only',
  user: 'Can access protected features and manage own data',
  moderator: 'Can moderate content and users',
  admin: 'Can manage users and access all features',
};

/**
 * Check if a user role meets the minimum required role
 */
export function hasMinimumRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

/**
 * Check if user is authenticated (not guest)
 */
export function isAuthenticatedRole(userRole: UserRole): boolean {
  return userRole !== 'guest';
}

/**
 * Check if user is regular user or admin
 */
export function isUser(userRole: UserRole): boolean {
  return userRole === 'user' || userRole === 'admin';
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: UserRole): string {
  return roleDisplayNames[role];
}

/**
 * Get description for a role
 */
export function getRoleDescription(role: UserRole): string {
  return roleDescriptions[role];
}

/**
 * Get all available roles
 */
export function getAllRoles(): UserRole[] {
  return Object.keys(roleHierarchy) as UserRole[];
}

/**
 * Get roles that are higher than or equal to the given role
 */
export function getRolesAtOrAbove(minRole: UserRole): UserRole[] {
  const minLevel = roleHierarchy[minRole];
  return getAllRoles().filter((role) => roleHierarchy[role] >= minLevel);
}

/**
 * Get roles that are lower than or equal to the given role
 */
export function getRolesAtOrBelow(maxRole: UserRole): UserRole[] {
  const maxLevel = roleHierarchy[maxRole];
  return getAllRoles().filter((role) => roleHierarchy[role] <= maxLevel);
}

/**
 * Compare two roles
 * Returns: -1 if role1 < role2, 0 if equal, 1 if role1 > role2
 */
export function compareRoles(role1: UserRole, role2: UserRole): number {
  const level1 = roleHierarchy[role1];
  const level2 = roleHierarchy[role2];

  if (level1 < level2) return -1;
  if (level1 > level2) return 1;
  return 0;
}

/**
 * Check if role1 can manage role2
 * A role can manage roles that are lower in hierarchy
 */
export function canManageRole(
  managerRole: UserRole,
  targetRole: UserRole
): boolean {
  return roleHierarchy[managerRole] > roleHierarchy[targetRole];
}

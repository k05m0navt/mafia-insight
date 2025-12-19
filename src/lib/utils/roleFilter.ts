/**
 * Role filter utility functions for analytics filtering
 *
 * Provides functions to format role filter labels, validate role filters,
 * and map role display names and colors.
 */

import type { PlayerRole } from '@/types/analytics';

/**
 * Role display name mapping
 */
export const ROLE_DISPLAY_NAMES: Record<PlayerRole, string> = {
  DON: 'Don',
  MAFIA: 'Mafia',
  SHERIFF: 'Sheriff',
  CITIZEN: 'Citizen',
};

/**
 * Role color mapping for visual indicators
 */
export const ROLE_COLORS: Record<PlayerRole, string> = {
  DON: 'bg-purple-100 text-purple-800 border-purple-300',
  MAFIA: 'bg-red-100 text-red-800 border-red-300',
  SHERIFF: 'bg-blue-100 text-blue-800 border-blue-300',
  CITIZEN: 'bg-green-100 text-green-800 border-green-300',
};

/**
 * All available roles
 */
export const ALL_ROLES: PlayerRole[] = ['DON', 'MAFIA', 'SHERIFF', 'CITIZEN'];

/**
 * Format role filter label for display badges
 * @param roles Array of selected roles
 * @returns Formatted string (e.g., "Don selected", "Mafia + Sheriff selected")
 */
export function formatRoleFilterLabel(roles: PlayerRole[]): string {
  if (!roles || roles.length === 0) {
    return 'All Roles';
  }

  if (roles.length === 1) {
    return `${ROLE_DISPLAY_NAMES[roles[0]]} selected`;
  }

  if (roles.length === ALL_ROLES.length) {
    return 'All Roles';
  }

  // Format multiple roles: "Don + Mafia selected"
  const displayNames = roles.map((role) => ROLE_DISPLAY_NAMES[role]);
  return `${displayNames.join(' + ')} selected`;
}

/**
 * Validate role filter
 * @param roles Array of role strings to validate
 * @returns Validation result with valid flag and optional error message
 */
export function validateRoleFilter(roles: string[]): {
  valid: boolean;
  error?: string;
  validatedRoles?: PlayerRole[];
} {
  if (!Array.isArray(roles)) {
    return { valid: false, error: 'Roles must be an array' };
  }

  // Empty array is valid (no filtering)
  if (roles.length === 0) {
    return { valid: true, validatedRoles: [] };
  }

  // Validate each role
  const validRoles: PlayerRole[] = [];
  for (const role of roles) {
    if (!ALL_ROLES.includes(role as PlayerRole)) {
      return {
        valid: false,
        error: `Invalid role: ${role}. Must be one of: ${ALL_ROLES.join(', ')}`,
      };
    }
    validRoles.push(role as PlayerRole);
  }

  return { valid: true, validatedRoles: validRoles };
}

/**
 * Convert roles array to query parameter string
 * @param roles Array of PlayerRole
 * @returns Comma-separated string (e.g., "don,mafia") or undefined if empty
 */
export function rolesToQueryParam(
  roles: PlayerRole[] | null | undefined
): string | undefined {
  if (!roles || roles.length === 0) {
    return undefined;
  }

  // Convert to lowercase for API (DON -> don)
  return roles.map((role) => role.toLowerCase()).join(',');
}

/**
 * Parse roles from query parameter string
 * @param rolesParam Comma-separated string (e.g., "don,mafia")
 * @returns Array of PlayerRole or undefined
 */
export function parseRolesFromQueryParam(
  rolesParam: string | null | undefined
): PlayerRole[] | undefined {
  if (!rolesParam) {
    return undefined;
  }

  const roles = rolesParam
    .split(',')
    .map((r) => r.trim().toUpperCase())
    .filter(Boolean);

  const validation = validateRoleFilter(roles);
  if (!validation.valid) {
    return undefined;
  }

  return validation.validatedRoles;
}

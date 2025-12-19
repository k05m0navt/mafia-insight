/**
 * Unit tests for role filter utilities
 */

import { describe, it, expect } from 'vitest';
import {
  formatRoleFilterLabel,
  validateRoleFilter,
  rolesToQueryParam,
  parseRolesFromQueryParam,
  ROLE_DISPLAY_NAMES,
  ALL_ROLES,
} from '@/lib/utils/roleFilter';
import type { PlayerRole } from '@/types/analytics';

describe('roleFilter utilities', () => {
  describe('formatRoleFilterLabel', () => {
    it('should return "All Roles" for empty array', () => {
      expect(formatRoleFilterLabel([])).toBe('All Roles');
    });

    it('should return "All Roles" for null/undefined', () => {
      expect(formatRoleFilterLabel(null as any)).toBe('All Roles');
      expect(formatRoleFilterLabel(undefined as any)).toBe('All Roles');
    });

    it('should format single role correctly', () => {
      expect(formatRoleFilterLabel(['DON'])).toBe('Don selected');
      expect(formatRoleFilterLabel(['MAFIA'])).toBe('Mafia selected');
      expect(formatRoleFilterLabel(['SHERIFF'])).toBe('Sheriff selected');
      expect(formatRoleFilterLabel(['CITIZEN'])).toBe('Citizen selected');
    });

    it('should format multiple roles correctly', () => {
      expect(formatRoleFilterLabel(['DON', 'MAFIA'])).toBe(
        'Don + Mafia selected'
      );
      expect(formatRoleFilterLabel(['DON', 'MAFIA', 'SHERIFF'])).toBe(
        'Don + Mafia + Sheriff selected'
      );
    });

    it('should return "All Roles" when all roles are selected', () => {
      expect(formatRoleFilterLabel(ALL_ROLES)).toBe('All Roles');
    });
  });

  describe('validateRoleFilter', () => {
    it('should return valid for empty array', () => {
      const result = validateRoleFilter([]);
      expect(result.valid).toBe(true);
      expect(result.validatedRoles).toEqual([]);
    });

    it('should return invalid for non-array input', () => {
      const result = validateRoleFilter('DON' as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an array');
    });

    it('should validate single valid role', () => {
      const result = validateRoleFilter(['DON']);
      expect(result.valid).toBe(true);
      expect(result.validatedRoles).toEqual(['DON']);
    });

    it('should validate multiple valid roles', () => {
      const result = validateRoleFilter(['DON', 'MAFIA', 'SHERIFF']);
      expect(result.valid).toBe(true);
      expect(result.validatedRoles).toEqual(['DON', 'MAFIA', 'SHERIFF']);
    });

    it('should return invalid for invalid role', () => {
      const result = validateRoleFilter(['INVALID_ROLE']);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid role');
    });

    it('should return invalid for mixed valid and invalid roles', () => {
      const result = validateRoleFilter(['DON', 'INVALID_ROLE']);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid role');
    });

    it('should validate all valid roles', () => {
      const result = validateRoleFilter(ALL_ROLES);
      expect(result.valid).toBe(true);
      expect(result.validatedRoles).toEqual(ALL_ROLES);
    });
  });

  describe('rolesToQueryParam', () => {
    it('should return undefined for empty array', () => {
      expect(rolesToQueryParam([])).toBeUndefined();
    });

    it('should return undefined for null/undefined', () => {
      expect(rolesToQueryParam(null)).toBeUndefined();
      expect(rolesToQueryParam(undefined)).toBeUndefined();
    });

    it('should convert single role to lowercase', () => {
      expect(rolesToQueryParam(['DON'])).toBe('don');
      expect(rolesToQueryParam(['MAFIA'])).toBe('mafia');
    });

    it('should convert multiple roles to comma-separated lowercase', () => {
      expect(rolesToQueryParam(['DON', 'MAFIA'])).toBe('don,mafia');
      expect(rolesToQueryParam(['DON', 'MAFIA', 'SHERIFF'])).toBe(
        'don,mafia,sheriff'
      );
    });
  });

  describe('parseRolesFromQueryParam', () => {
    it('should return undefined for null/undefined', () => {
      expect(parseRolesFromQueryParam(null)).toBeUndefined();
      expect(parseRolesFromQueryParam(undefined)).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(parseRolesFromQueryParam('')).toBeUndefined();
    });

    it('should parse single role', () => {
      expect(parseRolesFromQueryParam('don')).toEqual(['DON']);
      expect(parseRolesFromQueryParam('mafia')).toEqual(['MAFIA']);
    });

    it('should parse multiple comma-separated roles', () => {
      expect(parseRolesFromQueryParam('don,mafia')).toEqual(['DON', 'MAFIA']);
      expect(parseRolesFromQueryParam('don,mafia,sheriff')).toEqual([
        'DON',
        'MAFIA',
        'SHERIFF',
      ]);
    });

    it('should handle whitespace in query param', () => {
      expect(parseRolesFromQueryParam('don, mafia')).toEqual(['DON', 'MAFIA']);
      expect(parseRolesFromQueryParam(' don , mafia ')).toEqual([
        'DON',
        'MAFIA',
      ]);
    });

    it('should return undefined for invalid roles', () => {
      expect(parseRolesFromQueryParam('invalid')).toBeUndefined();
      expect(parseRolesFromQueryParam('don,invalid')).toBeUndefined();
    });

    it('should handle mixed case input', () => {
      expect(parseRolesFromQueryParam('Don')).toEqual(['DON']);
      expect(parseRolesFromQueryParam('DoN,MaFiA')).toEqual(['DON', 'MAFIA']);
    });
  });

  describe('ROLE_DISPLAY_NAMES', () => {
    it('should have display names for all roles', () => {
      expect(ROLE_DISPLAY_NAMES.DON).toBe('Don');
      expect(ROLE_DISPLAY_NAMES.MAFIA).toBe('Mafia');
      expect(ROLE_DISPLAY_NAMES.SHERIFF).toBe('Sheriff');
      expect(ROLE_DISPLAY_NAMES.CITIZEN).toBe('Citizen');
    });
  });

  describe('ALL_ROLES', () => {
    it('should contain all four roles', () => {
      expect(ALL_ROLES).toHaveLength(4);
      expect(ALL_ROLES).toContain('DON');
      expect(ALL_ROLES).toContain('MAFIA');
      expect(ALL_ROLES).toContain('SHERIFF');
      expect(ALL_ROLES).toContain('CITIZEN');
    });
  });
});

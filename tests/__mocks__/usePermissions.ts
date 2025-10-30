import { vi } from 'vitest';

export const usePermissions = () => ({
  canAccess: vi.fn(() => true),
  canEdit: vi.fn(() => true),
  canDelete: vi.fn(() => true),
  canView: vi.fn(() => true),
  hasRole: vi.fn(() => true),
  hasPermission: vi.fn(() => true),
  permissions: [],
  roles: [],
});

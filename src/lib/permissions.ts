import {
  Permission,
  PermissionConfig,
  PermissionUpdate,
} from '@/types/permissions';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/auth';

export class PermissionService {
  private static instance: PermissionService;
  private permissions: string[] = [];
  private permissionConfig: PermissionConfig = {};

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  private constructor() {
    this.initializeDefaultPermissions();
  }

  private initializeDefaultPermissions(): void {
    this.permissionConfig = {
      players: {
        read: ['user', 'admin'],
        write: ['admin'],
        admin: ['admin'],
      },
      analytics: {
        read: ['user', 'admin'],
        write: ['admin'],
        admin: ['admin'],
      },
      admin: {
        read: ['admin'],
        write: ['admin'],
        admin: ['admin'],
      },
      permissions: {
        read: ['admin'],
        write: ['admin'],
        admin: ['admin'],
      },
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Permission request failed');
    }

    return response.json();
  }

  async getAllPermissions(): Promise<Permission[]> {
    try {
      // Use absolute URL for admin permissions endpoint
      const url = '/api/admin/permissions';

      // Use cookies for authentication (same-origin requests automatically include cookies)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include', // Ensure cookies are sent
      });

      if (!response.ok) {
        // API is now public, so 401/403 shouldn't happen, but handle gracefully
        // For any errors, log but don't throw - return empty array to use fallbacks
        const errorData = await response.json().catch(() => ({}));
        console.warn(
          'Permission request failed:',
          errorData.message ||
            `HTTP ${response.status} - Permission request failed`
        );
        return [];
      }

      const data = await response.json();
      return data.permissions;
    } catch (error) {
      // Silently handle errors - guests and other edge cases should use fallback permissions
      // Only log for debugging, don't throw
      if (process.env.NODE_ENV === 'development') {
        console.debug('Failed to fetch permissions, using fallback:', error);
      }
      return [];
    }
  }

  async updatePermissions(
    updates: PermissionUpdate[]
  ): Promise<{ permissions: Permission[] } | void> {
    try {
      // Use absolute URL for admin permissions endpoint
      const url = '/api/admin/permissions';

      // Use cookies for authentication (same-origin requests automatically include cookies)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({ permissions: updates }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update permissions');
      }

      const result = await response.json();

      // Return the updated permissions if available
      // No need to refresh local permissions - the API already returns updated data
      if (result.permissions) {
        return { permissions: result.permissions };
      }
    } catch (error) {
      console.error('Failed to update permissions:', error);
      throw error;
    }
  }

  async refreshPermissions(): Promise<void> {
    try {
      const response = await this.makeRequest<{ permissions: string[] }>(
        '/permissions'
      );
      this.permissions = response.permissions;
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
      this.permissions = [];
    }
  }

  setPermissions(permissions: string[]): void {
    this.permissions = permissions;
  }

  getPermissions(): string[] {
    return this.permissions;
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  canAccessPage(pageId: string): boolean {
    const pagePermissions = this.getPagePermissions(pageId);
    if (pagePermissions.length === 0) {
      return true; // No permissions required
    }
    return this.hasAnyPermission(pagePermissions);
  }

  canAccessResource(resource: string, action: string): boolean {
    const permission = `${action}:${resource}`;
    return this.hasPermission(permission);
  }

  private getPagePermissions(pageId: string): string[] {
    const pagePermissionMap: Record<string, string[]> = {
      home: [],
      players: ['read:players'],
      analytics: ['read:analytics'],
      admin: ['admin:admin'],
      'admin/permissions': ['admin:permissions'],
      'admin/users': ['admin:users'],
    };

    return pagePermissionMap[pageId] || [];
  }

  getPermissionConfig(): PermissionConfig {
    return this.permissionConfig;
  }

  updatePermissionConfig(config: PermissionConfig): void {
    this.permissionConfig = config;
  }

  getRolesForPermission(resource: string, action: string): string[] {
    return this.permissionConfig[resource]?.[action] || [];
  }

  getPermissionsForRole(role: string): string[] {
    const permissions: string[] = [];

    for (const [resource, actions] of Object.entries(this.permissionConfig)) {
      for (const [action, roles] of Object.entries(actions)) {
        if (roles.includes(role)) {
          permissions.push(`${action}:${resource}`);
        }
      }
    }

    return permissions;
  }

  validatePermissionUpdate(update: PermissionUpdate): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!update.id) {
      errors.push('Permission ID is required');
    }

    if (!update.roles || !Array.isArray(update.roles)) {
      errors.push('Roles must be an array');
    } else if (update.roles.length === 0) {
      errors.push('At least one role must be specified');
    }

    const validRoles = ['admin', 'user', 'guest'];
    const invalidRoles =
      update.roles?.filter((role) => !validRoles.includes(role)) || [];
    if (invalidRoles.length > 0) {
      errors.push(`Invalid roles: ${invalidRoles.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const permissionService = PermissionService.getInstance();

export const createPermissionString = (
  action: string,
  resource: string
): string => {
  return `${action}:${resource}`;
};

export const parsePermissionString = (
  permission: string
): { action: string; resource: string } | null => {
  const parts = permission.split(':');
  if (parts.length !== 2) {
    return null;
  }

  return {
    action: parts[0],
    resource: parts[1],
  };
};

export const getDefaultPermissions = (): PermissionConfig => {
  return {
    players: {
      read: ['user', 'admin'],
      write: ['admin'],
      admin: ['admin'],
    },
    analytics: {
      read: ['user', 'admin'],
      write: ['admin'],
      admin: ['admin'],
    },
    admin: {
      read: ['admin'],
      write: ['admin'],
      admin: ['admin'],
    },
    permissions: {
      read: ['admin'],
      write: ['admin'],
      admin: ['admin'],
    },
  };
};

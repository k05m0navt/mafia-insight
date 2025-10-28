export interface Permission {
  id: string;
  resource: string;
  action: 'read' | 'write' | 'admin';
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionConfig {
  [resource: string]: {
    [action: string]: string[];
  };
}

export interface PermissionContextType {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccessPage: (pageId: string) => boolean;
  canAccessResource: (resource: string, action: string) => boolean;
}

export interface PermissionUpdate {
  id: string;
  roles: string[];
}

export interface PermissionError {
  message: string;
  code: string;
  resource?: string;
  action?: string;
}

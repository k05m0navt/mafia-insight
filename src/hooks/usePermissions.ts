import { useState, useEffect } from 'react';
import { authService } from '@/services/AuthService';

export interface Permission {
  canAccessPage: (page: string) => boolean;
  canPerformAction: (action: string) => boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export function usePermissions(): Permission {
  const [permissions, setPermissions] = useState<Permission>({
    canAccessPage: () => false,
    canPerformAction: () => false,
    hasRole: () => false,
    hasPermission: () => false,
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
  });

  useEffect(() => {
    const updatePermissions = () => {
      const user = authService.getCurrentUser();
      
      if (!user) {
        setPermissions({
          canAccessPage: () => false,
          canPerformAction: () => false,
          hasRole: () => false,
          hasPermission: () => false,
          hasAnyPermission: () => false,
          hasAllPermissions: () => false,
        });
        return;
      }

      setPermissions({
        canAccessPage: (page: string) => {
          // Define page access rules
          const pagePermissions: Record<string, string[]> = {
            '/admin': ['admin'],
            '/moderate': ['admin', 'moderator'],
            '/profile': ['admin', 'user', 'moderator'],
            '/settings': ['admin', 'user', 'moderator'],
          };

          const requiredRoles = pagePermissions[page] || [];
          return requiredRoles.includes(user.role);
        },
        canPerformAction: (action: string) => {
          // Define action permissions
          const actionPermissions: Record<string, string[]> = {
            'delete:user': ['admin'],
            'moderate:content': ['admin', 'moderator'],
            'view:analytics': ['admin'],
            'edit:profile': ['admin', 'user', 'moderator'],
          };

          const requiredRoles = actionPermissions[action] || [];
          return requiredRoles.includes(user.role);
        },
        hasRole: (role: string) => {
          return user.role === role;
        },
        hasPermission: (permission: string) => {
          // Define permission rules
          const permissionRules: Record<string, string[]> = {
            'admin:permissions': ['admin'],
            'admin:users': ['admin'],
            'moderate:content': ['admin', 'moderator'],
            'view:analytics': ['admin'],
            'edit:profile': ['admin', 'user', 'moderator'],
          };

          const requiredRoles = permissionRules[permission] || [];
          return requiredRoles.includes(user.role);
        },
        hasAnyPermission: (permissions: string[]) => {
          return permissions.some(permission => {
            const permissionRules: Record<string, string[]> = {
              'admin:permissions': ['admin'],
              'admin:users': ['admin'],
              'moderate:content': ['admin', 'moderator'],
              'view:analytics': ['admin'],
              'edit:profile': ['admin', 'user', 'moderator'],
            };

            const requiredRoles = permissionRules[permission] || [];
            return requiredRoles.includes(user.role);
          });
        },
        hasAllPermissions: (permissions: string[]) => {
          return permissions.every(permission => {
            const permissionRules: Record<string, string[]> = {
              'admin:permissions': ['admin'],
              'admin:users': ['admin'],
              'moderate:content': ['admin', 'moderator'],
              'view:analytics': ['admin'],
              'edit:profile': ['admin', 'user', 'moderator'],
            };

            const requiredRoles = permissionRules[permission] || [];
            return requiredRoles.includes(user.role);
          });
        },
      });
    };

    updatePermissions();

    // Listen for authentication changes
    const interval = setInterval(updatePermissions, 1000);

    return () => clearInterval(interval);
  }, []);

  return permissions;
}

export default usePermissions;
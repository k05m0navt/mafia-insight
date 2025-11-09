import { NavigationItem, UserRole } from '@/types/navigation';

export type { UserRole };

/**
 * Navigation menu configuration
 * Items are filtered by user role and permissions
 */
export const navigationMenu: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: 'Home',
    requiresAuth: false,
    requiredPermissions: [],
  },
  {
    id: 'players',
    label: 'Players',
    path: '/players',
    icon: 'Users',
    requiresAuth: false,
    requiredPermissions: [],
  },
  {
    id: 'tournaments',
    label: 'Tournaments',
    path: '/tournaments',
    icon: 'Trophy',
    requiresAuth: false,
    requiredPermissions: [],
  },
  {
    id: 'clubs',
    label: 'Clubs',
    path: '/clubs',
    icon: 'Building2',
    requiresAuth: false,
    requiredPermissions: [],
  },
  {
    id: 'games',
    label: 'Games',
    path: '/games',
    icon: 'Gamepad2',
    requiresAuth: false,
    requiredPermissions: [],
  },
  {
    id: 'admin',
    label: 'Admin',
    path: '/admin',
    icon: 'Settings',
    requiresAuth: true,
    requiredPermissions: ['admin:read'],
    children: [
      {
        id: 'admin-dashboard',
        label: 'Dashboard',
        path: '/admin/dashboard',
        icon: 'LayoutDashboard',
        requiresAuth: true,
        requiredPermissions: ['admin:read'],
      },
      {
        id: 'admin-import',
        label: 'Import',
        path: '/admin/import',
        icon: 'Database',
        requiresAuth: true,
        requiredPermissions: ['admin:read'],
      },
      {
        id: 'admin-users',
        label: 'Users',
        path: '/admin/users',
        icon: 'Users',
        requiresAuth: true,
        requiredPermissions: ['admin:read'],
      },
      {
        id: 'admin-permissions',
        label: 'Permissions',
        path: '/admin/permissions',
        icon: 'Lock',
        requiresAuth: true,
        requiredPermissions: ['admin:read'],
      },
    ],
  },
];

/**
 * Filter navigation items based on user role and permissions
 */
export function getNavigationMenu(userRole: UserRole): NavigationItem[] {
  return navigationMenu.filter((item) => {
    // Check if authentication is required
    if (item.requiresAuth && userRole === 'guest') {
      return false;
    }

    // For now, return all items that don't require auth or are accessible to the user
    // In a real implementation, you would check permissions here
    return true;
  });
}

/**
 * Check if user has required role for navigation item
 */
export function hasRequiredRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    guest: 0,
    user: 1,
    moderator: 1.5,
    admin: 2,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

import { NavigationItem, UserRole } from '@/types/navigation';

export type { UserRole };

/**
 * Navigation menu configuration
 * Items are filtered by user role
 */
export const navigationMenu: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: 'Home',
    requiredRole: 'GUEST',
    isVisible: true,
    order: 1,
  },
  {
    id: 'players',
    label: 'Players',
    href: '/players',
    icon: 'Users',
    requiredRole: 'GUEST',
    isVisible: true,
    order: 2,
  },
  {
    id: 'tournaments',
    label: 'Tournaments',
    href: '/tournaments',
    icon: 'Trophy',
    requiredRole: 'GUEST',
    isVisible: true,
    order: 3,
  },
  {
    id: 'clubs',
    label: 'Clubs',
    href: '/clubs',
    icon: 'Building2',
    requiredRole: 'GUEST',
    isVisible: true,
    order: 4,
  },
  {
    id: 'games',
    label: 'Games',
    href: '/games',
    icon: 'Gamepad2',
    requiredRole: 'GUEST',
    isVisible: true,
    order: 5,
  },
  {
    id: 'import-progress',
    label: 'Import Progress',
    href: '/import-progress',
    icon: 'Activity',
    requiredRole: 'USER',
    isVisible: true,
    order: 6,
  },
  {
    id: 'admin',
    label: 'Admin',
    href: '/admin',
    icon: 'Settings',
    requiredRole: 'ADMIN',
    isVisible: true,
    order: 7,
  },
];

/**
 * Filter navigation items based on user role
 */
export function getNavigationMenu(userRole: UserRole): NavigationItem[] {
  const roleHierarchy: Record<UserRole, number> = {
    GUEST: 0,
    USER: 1,
    ADMIN: 2,
  };

  const userRoleLevel = roleHierarchy[userRole];

  return navigationMenu
    .filter((item) => roleHierarchy[item.requiredRole] <= userRoleLevel)
    .filter((item) => item.isVisible)
    .sort((a, b) => a.order - b.order);
}

/**
 * Check if user has required role for navigation item
 */
export function hasRequiredRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    GUEST: 0,
    USER: 1,
    ADMIN: 2,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

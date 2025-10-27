export type UserRole = 'GUEST' | 'USER' | 'ADMIN';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  requiredRole: UserRole;
  isVisible: boolean;
  order: number;
  children?: NavigationItem[];
}

export interface NavigationMenuConfig {
  items: NavigationItem[];
}

export interface NavigationContext {
  menuItems: NavigationItem[];
  currentPath: string;
  userRole: UserRole;
}

export type UserRole = 'admin' | 'user' | 'moderator' | 'guest';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  requiresAuth: boolean;
  requiredPermissions: string[];
  children?: NavigationItem[];
}

export interface NavigationState {
  userId: string | null;
  activePage: string;
  visiblePages: string[];
  lastUpdated: Date;
}

export interface Page {
  id: string;
  name: string;
  path: string;
  icon: string;
  requiresAuth: boolean;
  requiredPermissions: string[];
}

export interface NavigationContextType {
  navigationState: NavigationState;
  setActivePage: (pageId: string) => void;
  updateVisiblePages: (pages: string[]) => void;
  getVisiblePages: () => NavigationItem[];
  isPageVisible: (pageId: string) => boolean;
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePermissions } from './usePermissions';
import { NavigationState, NavigationItem } from '@/types/navigation';

export function useNavigation() {
  const pathname = usePathname();
  const { authState } = useAuth();
  const { canAccessPage } = usePermissions();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    userId: authState.user?.id || null,
    activePage: pathname,
    visiblePages: [],
    lastUpdated: new Date(),
  });

  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      icon: '🏠',
      requiresAuth: false,
      requiredPermissions: [],
    },
    {
      id: 'players',
      label: 'Players',
      path: '/players',
      icon: '👥',
      requiresAuth: true,
      requiredPermissions: ['read:players'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/analytics',
      icon: '📊',
      requiresAuth: true,
      requiredPermissions: ['read:analytics'],
    },
    {
      id: 'admin',
      label: 'Admin',
      path: '/admin',
      icon: '⚙️',
      requiresAuth: true,
      requiredPermissions: ['admin:admin'],
    },
  ];

  const updateVisiblePages = useCallback(() => {
    const visiblePages = navigationItems
      .filter((item) => {
        if (!item.requiresAuth) return true;
        if (!authState.isAuthenticated) return false;
        return canAccessPage(item.id);
      })
      .map((item) => item.id);

    setNavigationState((prev) => ({
      ...prev,
      visiblePages,
      lastUpdated: new Date(),
    }));
  }, [authState.isAuthenticated, canAccessPage]);

  const setActivePage = useCallback((pageId: string) => {
    setNavigationState((prev) => ({
      ...prev,
      activePage: pageId,
      lastUpdated: new Date(),
    }));
  }, []);

  const getVisiblePages = useCallback((): NavigationItem[] => {
    return navigationItems.filter((item) =>
      navigationState.visiblePages.includes(item.id)
    );
  }, [navigationState.visiblePages]);

  const isPageVisible = useCallback(
    (pageId: string): boolean => {
      return navigationState.visiblePages.includes(pageId);
    },
    [navigationState.visiblePages]
  );

  // Update active page when pathname changes
  useEffect(() => {
    const currentPage = navigationItems.find((item) => item.path === pathname);
    if (currentPage) {
      setActivePage(currentPage.id);
    }
  }, [pathname, setActivePage]);

  // Update visible pages when auth state or permissions change
  useEffect(() => {
    updateVisiblePages();
  }, [updateVisiblePages]);

  // Update user ID when auth state changes
  useEffect(() => {
    setNavigationState((prev) => ({
      ...prev,
      userId: authState.user?.id || null,
    }));
  }, [authState.user?.id]);

  return {
    navigationState,
    setActivePage,
    updateVisiblePages,
    getVisiblePages,
    isPageVisible,
  };
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { useMobileMenu } from '@/hooks/useMobileMenu';
import { NavItem } from './NavItem';
import { ThemeToggle } from './ThemeToggle';
import { AuthControls } from './AuthControls';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Menu } from 'lucide-react';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className = '' }: NavbarProps) {
  const { authState } = useAuth();
  const { canAccessPage } = usePermissions();
  const {
    isOpen: isMobileMenuOpen,
    open: openMobileMenu,
    close: closeMobileMenu,
    toggle: toggleMobileMenu,
  } = useMobileMenu();

  const navigationItems = [
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
      requiresAuth: false,
      requiredPermissions: [],
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      path: '/tournaments',
      icon: '🏆',
      requiresAuth: false,
      requiredPermissions: [],
    },
    {
      id: 'clubs',
      label: 'Clubs',
      path: '/clubs',
      icon: '🏢',
      requiresAuth: false,
      requiredPermissions: [],
    },
    {
      id: 'games',
      label: 'Games',
      path: '/games',
      icon: '🎮',
      requiresAuth: false,
      requiredPermissions: [],
    },
    {
      id: 'import-progress',
      label: 'Import Progress',
      path: '/import-progress',
      icon: '📈',
      requiresAuth: true,
      requiredPermissions: ['players:read'],
    },
    {
      id: 'admin',
      label: 'Admin',
      path: '/admin',
      icon: '⚙️',
      requiresAuth: true,
      requiredPermissions: ['admin:read'],
    },
  ];

  const visibleItems = navigationItems.filter((item) => {
    if (!item.requiresAuth) return true;
    if (!authState.isAuthenticated) return false;
    try {
      return canAccessPage(item.id);
    } catch (error) {
      console.error('Error checking page access:', error);
      return false;
    }
  });

  return (
    <nav
      className={`sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm ${className}`}
      data-testid="navbar"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors"
              data-testid="nav-logo"
            >
              <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  M
                </span>
              </div>
              Mafia Insight
            </Link>
          </div>

          {/* Navigation Items - Centered */}
          <div className="hidden md:flex flex-1 justify-center">
            <NavigationMenu>
              <NavigationMenuList>
                {visibleItems.map((item) => {
                  if (!item.path) {
                    console.error('Navigation item has undefined path:', item);
                    return null;
                  }
                  return (
                    <NavigationMenuItem key={item.id}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.path}
                          className={navigationMenuTriggerStyle()}
                          data-testid={`nav-${item.id}`}
                        >
                          <span className="flex items-center">
                            {item.icon && (
                              <span className="mr-2 text-lg" aria-hidden="true">
                                {item.icon}
                              </span>
                            )}
                            <span className="font-medium">{item.label}</span>
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side controls - Desktop */}
          <div className="hidden md:flex items-center space-x-2 ml-auto">
            <ThemeToggle />
            <AuthControls />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden ml-auto">
            <Sheet
              open={isMobileMenuOpen}
              onOpenChange={(open) =>
                open ? openMobileMenu() : closeMobileMenu()
              }
            >
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  data-testid="mobile-menu-button"
                  aria-label="Open navigation menu"
                  onClick={toggleMobileMenu}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                </VisuallyHidden>
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center p-6 border-b border-border">
                    <Link
                      href="/"
                      className="flex items-center gap-3 text-xl font-bold text-foreground"
                      onClick={closeMobileMenu}
                    >
                      <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">
                          M
                        </span>
                      </div>
                      <span>Mafia Insight</span>
                    </Link>
                  </div>

                  {/* Mobile Navigation Items */}
                  <nav className="flex-1 px-6 py-8 space-y-1">
                    {visibleItems.map((item) => {
                      if (!item.path) {
                        console.error(
                          'Navigation item has undefined path:',
                          item
                        );
                        return null;
                      }
                      return (
                        <NavItem
                          key={item.id}
                          label={item.label}
                          path={item.path}
                          icon={item.icon}
                          mobile
                          data-testid={`nav-${item.id}`}
                          onClick={closeMobileMenu}
                        />
                      );
                    })}
                  </nav>

                  {/* Mobile Controls */}
                  <div className="p-6 border-t border-border space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Theme
                      </span>
                      <ThemeToggle />
                    </div>
                    <div className="space-y-3">
                      <AuthControls mobile />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

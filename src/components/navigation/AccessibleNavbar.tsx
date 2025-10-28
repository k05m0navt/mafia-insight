/**
 * Accessible Navigation Bar
 *
 * WCAG 2.1 AA compliant navigation component with full keyboard
 * navigation support and screen reader compatibility.
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAccessibility } from '@/lib/accessibility';
import { useOptimizedNavigation } from '@/lib/navigation-optimized';
import { useOptimizedTheme } from '@/lib/theme-optimized';
import { useAuth } from '@/hooks/useAuth';

interface AccessibleNavbarProps {
  className?: string;
}

export const AccessibleNavbar: React.FC<AccessibleNavbarProps> = ({
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, setActiveItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null);

  const { announce, trapFocus } = useAccessibility();
  const { visibleItems, activePage, setActivePage } = useOptimizedNavigation();
  const { theme, toggleTheme } = useOptimizedTheme();
  const { authState, logout } = useAuth();
  const { user, isAuthenticated } = authState;

  // Focus management for mobile menu
  useEffect(() => {
    if (isMenuOpen && menuRef.current) {
      const cleanup = trapFocus(menuRef.current);
      return cleanup;
    }
  }, [isMenuOpen, trapFocus]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
        announce('Navigation menu closed');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen, announce]);

  const handleMenuToggle = () => {
    const newMenuState = !isMenuOpen;
    setIsMenuOpen(newMenuState);

    if (newMenuState) {
      announce('Navigation menu opened');
      // Focus first menu item after a brief delay
      setTimeout(() => {
        firstMenuItemRef.current?.focus();
      }, 100);
    } else {
      announce('Navigation menu closed');
    }
  };

  const handleMenuItemClick = (item: {
    href: string;
    id: string;
    label: string;
  }) => {
    setActivePage(item.href);
    setActiveItem(item.id);
    setIsMenuOpen(false);
    announce(`Navigated to ${item.label}`);

    // Return focus to menu button
    menuButtonRef.current?.focus();
  };

  const handleThemeToggle = () => {
    toggleTheme();
    const newTheme = theme === 'light' ? 'dark' : 'light';
    announce(`Theme changed to ${newTheme} mode`);
  };

  const handleLogout = () => {
    logout();
    announce('Logged out successfully');
  };

  const handleKeyDown = (
    event: React.KeyboardEvent,
    item: { href: string; id: string; label: string }
  ) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleMenuItemClick(item);
        break;
      case 'ArrowDown': {
        event.preventDefault();
        const nextItem = event.currentTarget.nextElementSibling as HTMLElement;
        if (nextItem) {
          nextItem.focus();
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prevItem = event.currentTarget
          .previousElementSibling as HTMLElement;
        if (prevItem) {
          prevItem.focus();
        } else {
          menuButtonRef.current?.focus();
        }
        break;
      }
      case 'Home': {
        event.preventDefault();
        firstMenuItemRef.current?.focus();
        break;
      }
      case 'End': {
        event.preventDefault();
        const menuItems =
          menuRef.current?.querySelectorAll('[role="menuitem"]');
        const lastItem = menuItems?.[menuItems.length - 1] as HTMLElement;
        lastItem?.focus();
        break;
      }
    }
  };

  return (
    <nav
      className={`bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex-shrink-0 flex items-center"
              aria-label="Mafia Insight - Go to home page"
            >
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Mafia Insight
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {visibleItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activePage === item.href
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-current={activePage === item.href ? 'page' : undefined}
                onFocus={() => setActiveItem(item.id)}
                onBlur={() => setActiveItem(null)}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Theme Toggle and User Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="User menu"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <a
                  href="/login"
                  className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Sign Up
                </a>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              ref={menuButtonRef}
              onClick={handleMenuToggle}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          id="mobile-menu"
          className="md:hidden"
          role="menu"
          aria-label="Mobile navigation menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            {visibleItems.map((item, index) => (
              <a
                key={item.id}
                ref={index === 0 ? firstMenuItemRef : undefined}
                href={item.href}
                role="menuitem"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  activePage === item.href
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-current={activePage === item.href ? 'page' : undefined}
                onClick={() => handleMenuItemClick(item)}
                onKeyDown={(e) => handleKeyDown(e, item)}
                tabIndex={0}
              >
                {item.label}
              </a>
            ))}

            {/* Mobile theme toggle */}
            <button
              onClick={handleThemeToggle}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              Switch to {theme === 'light' ? 'dark' : 'light'} theme
            </button>

            {/* Mobile auth buttons */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              >
                Logout
              </button>
            ) : (
              <>
                <a
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

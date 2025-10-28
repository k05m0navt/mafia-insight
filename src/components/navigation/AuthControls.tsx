'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

interface AuthControlsProps {
  className?: string;
  mobile?: boolean;
}

export function AuthControls({
  className = '',
  mobile = false,
}: AuthControlsProps) {
  const { authState, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!authState.isAuthenticated) {
    if (mobile) {
      return (
        <div className={`flex flex-col space-y-3 ${className}`}>
          <Link
            href="/login"
            className="flex items-center justify-center px-6 py-4 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 active:scale-95"
            data-testid="login-button"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="flex items-center justify-center px-6 py-4 rounded-xl text-base font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 active:scale-95"
            data-testid="signup-button"
          >
            Sign Up
          </Link>
        </div>
      );
    }

    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Link
          href="/login"
          className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          data-testid="login-button"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-3 py-2 rounded-md text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
          data-testid="signup-button"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  if (mobile) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="px-4 py-4 bg-muted/50 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                👤
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {authState.user?.email}
              </p>
              <p
                className="text-xs text-muted-foreground"
                data-testid="user-role"
              >
                {authState.user?.role || 'guest'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Link
            href="/profile"
            className="flex items-center px-4 py-4 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 active:scale-95"
            onClick={() => setIsMenuOpen(false)}
          >
            Profile
          </Link>

          <Link
            href="/settings"
            className="flex items-center px-4 py-4 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 active:scale-95"
            onClick={() => setIsMenuOpen(false)}
          >
            Settings
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-4 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 active:scale-95"
            data-testid="logout-button"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 p-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
        data-testid="user-menu"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        <span className="text-lg" aria-hidden="true">
          👤
        </span>
        <span className="hidden sm:block">{authState.user?.email}</span>
        <span
          className="text-xs text-gray-500 dark:text-gray-400"
          data-testid="user-role"
        >
          {authState.user?.role || 'guest'}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isMenuOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-popover rounded-md shadow-lg py-1 z-50 border border-border"
          data-testid="user-menu-dropdown"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-4 py-2 text-sm text-popover-foreground border-b border-border">
            <div className="font-medium">{authState.user?.email}</div>
            <div className="text-xs text-muted-foreground">
              Role: {authState.user?.role || 'guest'}
            </div>
          </div>

          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors"
            role="menuitem"
            onClick={() => setIsMenuOpen(false)}
          >
            Profile
          </Link>

          <Link
            href="/settings"
            className="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors"
            role="menuitem"
            onClick={() => setIsMenuOpen(false)}
          >
            Settings
          </Link>

          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors"
            role="menuitem"
            data-testid="logout-button"
          >
            Logout
          </button>
        </div>
      )}

      {/* Overlay to close menu when clicking outside */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

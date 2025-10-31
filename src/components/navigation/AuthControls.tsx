'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ProfileDropdown } from '@/components/layout/ProfileDropdown';

interface AuthControlsProps {
  className?: string;
  mobile?: boolean;
}

export function AuthControls({
  className = '',
  mobile = false,
}: AuthControlsProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [_isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isAuthenticated) {
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
        {/* User Info Card */}
        <div className="px-4 py-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-xl">
                {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground truncate">
                {user?.name || user?.email || 'Guest'}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email || 'Not signed in'}
              </p>
              <p
                className="text-xs font-medium text-primary capitalize mt-1"
                data-testid="user-role"
              >
                {user?.role === 'admin' ? '⭐ Admin' : user?.role || 'Guest'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Link
            href="/profile"
            className="flex items-center px-4 py-3 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted text-foreground transition-all duration-200 active:scale-[0.98]"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="mr-3 text-lg">👤</span>
            View Profile
          </Link>

          <Link
            href="/settings"
            className="flex items-center px-4 py-3 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted text-foreground transition-all duration-200 active:scale-[0.98]"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="mr-3 text-lg">⚙️</span>
            Settings
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center px-4 py-3 rounded-lg text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200 active:scale-[0.98]"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="mr-3 text-lg">⚡</span>
              Admin Dashboard
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all duration-200 active:scale-[0.98]"
            data-testid="logout-button"
          >
            <span className="mr-3 text-lg">🚪</span>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Use ProfileDropdown for desktop
  return (
    <div className={className}>
      <ProfileDropdown
        user={{
          name: user?.name,
          email: user?.email,
          avatar: user?.avatar,
          role: user?.role,
        }}
      />
    </div>
  );
}

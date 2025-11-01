'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/navigation/Navbar';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { useAuthStore } from '@/store/authStore';
import { Toaster } from '@/components/ui/toaster';
import { SessionExpiredToast } from '@/components/auth/SessionExpiredToast';
import { AuthErrorHandler } from '@/components/auth/AuthErrorHandler';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AuthInitializer component to initialize Zustand store on mount and navigation
 */
function AuthInitializer() {
  const pathname = usePathname();
  const { checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // Initialize auth state on mount
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    // Re-check auth state on navigation
    checkAuthStatus();
  }, [pathname, checkAuthStatus]);

  // Listen for visibility changes (tab focus) to check auth state
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuthStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuthStatus]);

  return null;
}

export function Layout({ children, className = '' }: LayoutProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AuthInitializer />
        <SessionExpiredToast />
        <AuthErrorHandler />
        <Toaster />
        <div
          className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ${className}`}
        >
          <Navbar />
          <main className="flex-1">{children}</main>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/navigation/Navbar';
import { Providers } from '@/components/providers';
import { useAuthStore } from '@/store/authStore';
import { SessionExpiredToast } from '@/components/auth/SessionExpiredToast';
import { AuthErrorHandler } from '@/components/auth/AuthErrorHandler';

// Dynamically import Toaster without SSR to prevent hydration mismatches
const Toaster = dynamic(
  () => import('@/components/ui/toaster').then((mod) => mod.Toaster),
  { ssr: false }
);

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

  // Listen for auth-change events (from AuthService)
  useEffect(() => {
    const handleAuthChange = () => {
      console.log(
        '[AuthInitializer] auth-change event received, re-checking auth status'
      );
      checkAuthStatus();
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [checkAuthStatus]);

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
    <Providers>
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
    </Providers>
  );
}

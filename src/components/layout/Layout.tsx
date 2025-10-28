'use client';

import React from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className = '' }: LayoutProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
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

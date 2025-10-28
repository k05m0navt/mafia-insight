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
        <div className={`min-h-screen bg-background ${className}`}>
          <Navbar />
          <main className="flex-1">{children}</main>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

'use client';

import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { toggleTheme, isDark, mounted } = useTheme();

  // Prevent hydration mismatch by using default theme until mounted
  // This ensures server and client render the same initial state
  const displayIsDark = mounted ? isDark : false;

  const getIcon = () => {
    return displayIsDark ? '☀️' : '🌙';
  };

  const getLabel = () => {
    return displayIsDark ? 'Switch to light theme' : 'Switch to dark theme';
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors ${className}`}
      data-testid="theme-toggle"
      aria-label={getLabel()}
      aria-pressed={displayIsDark}
      title={getLabel()}
      suppressHydrationWarning
    >
      <span className="text-lg" aria-hidden="true" suppressHydrationWarning>
        {getIcon()}
      </span>
    </button>
  );
}

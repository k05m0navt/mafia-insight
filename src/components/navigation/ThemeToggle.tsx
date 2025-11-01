'use client';

import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { toggleTheme, isDark } = useTheme();

  const getIcon = () => {
    return isDark ? '☀️' : '🌙';
  };

  const getLabel = () => {
    return isDark ? 'Switch to light theme' : 'Switch to dark theme';
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors ${className}`}
      data-testid="theme-toggle"
      aria-label={getLabel()}
      aria-pressed={isDark}
      title={getLabel()}
    >
      <span className="text-lg" aria-hidden="true">
        {getIcon()}
      </span>
    </button>
  );
}

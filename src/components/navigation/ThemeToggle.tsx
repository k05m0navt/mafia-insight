'use client';

import React from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  const getIcon = () => {
    if (theme === 'system') {
      return '💻';
    }
    return isDark ? '☀️' : '🌙';
  };

  const getLabel = () => {
    if (theme === 'system') {
      return 'System theme';
    }
    return isDark ? 'Switch to light theme' : 'Switch to dark theme';
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors ${className}`}
      data-testid="theme-toggle"
      aria-label={getLabel()}
      aria-pressed={theme !== 'system'}
      title={getLabel()}
    >
      <span className="text-lg" aria-hidden="true">
        {getIcon()}
      </span>
    </button>
  );
}

import React from 'react';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemePreference {
  userId: string | null;
  theme: Theme;
  updatedAt: Date;
}

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: 'light' | 'dark';
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

export interface ThemeProviderContext extends ThemeContextType {
  children: React.ReactNode;
}

export interface ThemeConfig {
  light: {
    '--bg-color': string;
    '--text-color': string;
    '--primary-color': string;
    '--secondary-color': string;
    '--accent-color': string;
    '--border-color': string;
    '--shadow-color': string;
  };
  dark: {
    '--bg-color': string;
    '--text-color': string;
    '--primary-color': string;
    '--secondary-color': string;
    '--accent-color': string;
    '--border-color': string;
    '--shadow-color': string;
  };
}

export interface ThemeError {
  message: string;
  code: string;
}

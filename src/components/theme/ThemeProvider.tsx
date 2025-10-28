'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Theme, ThemeContextType } from '@/types/theme';
import { themeService } from '@/lib/theme';
import { useCurrentUser } from '@/components/auth/AuthProvider';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);
  const [isLight, setIsLight] = useState(true);
  const [isSystem, setIsSystem] = useState(true);
  const user = useCurrentUser();

  useEffect(() => {
    // Initialize theme from service
    const currentTheme = themeService.getTheme();
    setThemeState(currentTheme);
    updateThemeState(currentTheme);

    // Listen for theme changes
    const unsubscribe = themeService.addListener((newTheme) => {
      setThemeState(newTheme);
      updateThemeState(newTheme);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Load user's theme preference when user changes
    if (user) {
      themeService.loadThemePreference(user.id);
    }
  }, [user]);

  const updateThemeState = (currentTheme: Theme) => {
    const effectiveTheme = themeService.getEffectiveTheme();
    setIsDark(effectiveTheme === 'dark');
    setIsLight(effectiveTheme === 'light');
    setIsSystem(currentTheme === 'system');
  };

  const setTheme = (newTheme: Theme): void => {
    themeService.setTheme(newTheme);
    setThemeState(newTheme);
    updateThemeState(newTheme);

    // Save theme preference for authenticated users
    if (user) {
      themeService.saveThemePreference();
    }
  };

  const toggleTheme = (): void => {
    themeService.toggleTheme();
    const newTheme = themeService.getTheme();
    setThemeState(newTheme);
    updateThemeState(newTheme);

    // Save theme preference for authenticated users
    if (user) {
      themeService.saveThemePreference();
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme: isDark ? 'dark' : 'light',
    toggleTheme,
    isDark,
    isLight,
    isSystem,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for getting current effective theme (light/dark)
export function useEffectiveTheme(): 'light' | 'dark' {
  const { isDark } = useTheme();
  return isDark ? 'dark' : 'light';
}

// Hook for checking if theme is dark
export function useIsDark(): boolean {
  const { isDark } = useTheme();
  return isDark;
}

// Hook for checking if theme is light
export function useIsLight(): boolean {
  const { isLight } = useTheme();
  return isLight;
}

// Hook for checking if theme is system
export function useIsSystemTheme(): boolean {
  const { isSystem } = useTheme();
  return isSystem;
}

// Hook for theme toggle functionality
export function useThemeToggle() {
  const { toggleTheme, theme } = useTheme();

  return {
    toggleTheme,
    currentTheme: theme,
    nextTheme:
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light',
  };
}

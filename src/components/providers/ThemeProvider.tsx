'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  startTransition,
} from 'react';
import { Theme, ThemeContextType } from '@/types/theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
}: ThemeProviderProps) {
  // Always start with defaultTheme to avoid hydration mismatch
  // We'll read from localStorage in useEffect after hydration
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage after component mounts (client-side only)
  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });

    // Check for guest preferences in session storage first (for guests)
    let savedTheme: Theme | null = null;

    try {
      // Try session storage for guest preferences
      const guestPrefs = sessionStorage.getItem('guest_preferences');
      if (guestPrefs) {
        const prefs = JSON.parse(guestPrefs);
        if (prefs.theme && ['light', 'dark'].includes(prefs.theme)) {
          savedTheme = prefs.theme as Theme;
        }
      }
    } catch (_error) {
      // Ignore session storage errors, fall back to localStorage
    }

    // Fall back to localStorage if no guest preference found
    if (!savedTheme) {
      const storedTheme = localStorage.getItem('theme') as Theme;
      if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
        savedTheme = storedTheme;
      } else if (storedTheme && !['light', 'dark'].includes(storedTheme)) {
        // Remove invalid theme from localStorage
        localStorage.removeItem('theme');
      }
    }

    if (savedTheme) {
      startTransition(() => {
        setTheme(savedTheme);
      });
    }
  }, []);

  // Apply theme to document immediately
  // This runs on both server and client, but theme state is consistent (defaultTheme initially)
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Add new theme class
    root.classList.add(theme);

    // Set data attribute for CSS custom properties
    root.setAttribute('data-theme', theme);

    // Save to localStorage (only if mounted and not a guest preference)
    if (mounted) {
      try {
        const guestPrefs = sessionStorage.getItem('guest_preferences');
        if (!guestPrefs) {
          // Only save to localStorage if not using guest preferences
          localStorage.setItem('theme', theme);
        }
      } catch (_error) {
        // Ignore storage errors
      }
    }
  }, [theme, mounted]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme: () => {
      setTheme(theme === 'light' ? 'dark' : 'light');
    },
    isDark: theme === 'dark',
    isLight: theme === 'light',
    mounted, // Expose mounted state to prevent hydration mismatches
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

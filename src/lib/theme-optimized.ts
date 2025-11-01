/**
 * Optimized Theme Management
 *
 * High-performance theme switching with CSS custom properties
 * and localStorage persistence, meeting <500ms performance requirement.
 */

import { themePerformance } from './performance';

export type Theme = 'light' | 'dark';

export interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  loading: boolean;
}

export interface ThemeConfig {
  storageKey: string;
  defaultTheme: Theme;
  enableSmoothTransitions: boolean;
  transitionDuration: number;
}

const DEFAULT_CONFIG: ThemeConfig = {
  storageKey: 'mafia-insight-theme',
  defaultTheme: 'light',
  enableSmoothTransitions: true,
  transitionDuration: 200, // 200ms for smooth transitions
};

class OptimizedThemeManager {
  private config: ThemeConfig;
  private listeners: Set<(state: ThemeState) => void> = new Set();
  private state: ThemeState = {
    theme: 'light',
    resolvedTheme: 'light',
    loading: true,
  };

  constructor(config: Partial<ThemeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  private initialize(): void {
    // Load theme from localStorage
    const savedTheme = this.loadThemeFromStorage();
    this.state.theme = savedTheme || this.config.defaultTheme;
    this.state.resolvedTheme = this.state.theme;

    this.state.loading = false;

    // Apply theme immediately
    this.applyTheme();
  }

  private loadThemeFromStorage(): Theme | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored && ['light', 'dark'].includes(stored)) {
        return stored as Theme;
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }

    return null;
  }

  private saveThemeToStorage(theme: Theme): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.config.storageKey, theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }

  private applyTheme(): void {
    if (typeof document === 'undefined') return;

    const endMeasure = themePerformance.startSwitch(this.state.resolvedTheme);

    try {
      // Use CSS custom properties for instant theme switching
      const root = document.documentElement;

      // Remove existing theme classes
      root.classList.remove('light', 'dark');

      // Add new theme class
      root.classList.add(this.state.resolvedTheme);

      // Set CSS custom properties for immediate visual feedback
      this.setCSSProperties();

      // Enable smooth transitions after a brief delay
      if (this.config.enableSmoothTransitions) {
        setTimeout(() => {
          root.style.transition = `color ${this.config.transitionDuration}ms ease, background-color ${this.config.transitionDuration}ms ease`;
        }, 10);
      }
    } finally {
      endMeasure();
    }
  }

  private setCSSProperties(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const isDark = this.state.resolvedTheme === 'dark';

    // Define theme-specific CSS custom properties
    const lightTheme = {
      '--background': '0 0% 100%',
      '--foreground': '222.2 84% 4.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '222.2 84% 4.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '222.2 84% 4.9%',
      '--primary': '222.2 47.4% 11.2%',
      '--primary-foreground': '210 40% 98%',
      '--secondary': '210 40% 96%',
      '--secondary-foreground': '222.2 84% 4.9%',
      '--muted': '210 40% 96%',
      '--muted-foreground': '215.4 16.3% 46.9%',
      '--accent': '210 40% 96%',
      '--accent-foreground': '222.2 84% 4.9%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '210 40% 98%',
      '--border': '214.3 31.8% 91.4%',
      '--input': '214.3 31.8% 91.4%',
      '--ring': '222.2 84% 4.9%',
      '--radius': '0.5rem',
    };

    const darkTheme = {
      '--background': '222.2 84% 4.9%',
      '--foreground': '210 40% 98%',
      '--card': '222.2 84% 4.9%',
      '--card-foreground': '210 40% 98%',
      '--popover': '222.2 84% 4.9%',
      '--popover-foreground': '210 40% 98%',
      '--primary': '210 40% 98%',
      '--primary-foreground': '222.2 47.4% 11.2%',
      '--secondary': '217.2 32.6% 17.5%',
      '--secondary-foreground': '210 40% 98%',
      '--muted': '217.2 32.6% 17.5%',
      '--muted-foreground': '215 20.2% 65.1%',
      '--accent': '217.2 32.6% 17.5%',
      '--accent-foreground': '210 40% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '210 40% 98%',
      '--border': '217.2 32.6% 17.5%',
      '--input': '217.2 32.6% 17.5%',
      '--ring': '212.7 26.8% 83.9%',
      '--radius': '0.5rem',
    };

    const theme = isDark ? darkTheme : lightTheme;

    // Apply CSS custom properties
    Object.entries(theme).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in theme listener:', error);
      }
    });
  }

  private resolveTheme(): void {
    // Update resolvedTheme to match the current theme
    // In the future, this could handle 'system' theme detection
    this.state.resolvedTheme = this.state.theme;
  }

  /**
   * Set the theme
   */
  setTheme(theme: Theme): void {
    if (this.state.theme === theme) return;

    this.state.theme = theme;
    this.resolveTheme();
    this.saveThemeToStorage(theme);
    this.applyTheme();
    this.notifyListeners();
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme = this.state.resolvedTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Get current theme state
   */
  getState(): ThemeState {
    return { ...this.state };
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(listener: (state: ThemeState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return themePerformance.getStats();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.listeners.clear();
  }
}

// Global theme manager instance
export const themeManager = new OptimizedThemeManager();

/**
 * React hook for optimized theme management
 */
export function useOptimizedTheme() {
  const [state, setState] = React.useState<ThemeState>(() =>
    themeManager.getState()
  );

  React.useEffect(() => {
    const unsubscribe = themeManager.subscribe(setState);
    return unsubscribe;
  }, []);

  const setTheme = React.useCallback((theme: Theme) => {
    themeManager.setTheme(theme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    themeManager.toggleTheme();
  }, []);

  return {
    ...state,
    setTheme,
    toggleTheme,
    getPerformanceStats: themeManager.getPerformanceStats.bind(themeManager),
  };
}

// React import
import React from 'react';

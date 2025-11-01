import { Theme, ThemeConfig } from '@/types/theme';
import { ThemeError } from './errors';

const THEME_STORAGE_KEY = 'theme';
const THEME_CONFIG: ThemeConfig = {
  light: {
    '--bg-color': '#ffffff',
    '--text-color': '#000000',
    '--primary-color': '#3b82f6',
    '--secondary-color': '#6b7280',
    '--accent-color': '#10b981',
    '--border-color': '#e5e7eb',
    '--shadow-color': 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    '--bg-color': '#1f2937',
    '--text-color': '#f9fafb',
    '--primary-color': '#60a5fa',
    '--secondary-color': '#9ca3af',
    '--accent-color': '#34d399',
    '--border-color': '#374151',
    '--shadow-color': 'rgba(0, 0, 0, 0.3)',
  },
};

export class ThemeService {
  private static instance: ThemeService;
  private currentTheme: Theme = 'light';
  private listeners: Set<(theme: Theme) => void> = new Set();

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeTheme();
    }
  }

  private initializeTheme(): void {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
      this.currentTheme = storedTheme;
    } else {
      this.currentTheme = 'light';
    }

    this.applyTheme();
  }

  private applyTheme(): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Add new theme class
    root.classList.add(this.currentTheme);

    // Apply CSS custom properties
    const themeConfig = THEME_CONFIG[this.currentTheme];
    Object.entries(themeConfig).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Notify listeners
    this.listeners.forEach((listener) => listener(this.currentTheme));
  }

  getTheme(): Theme {
    return this.currentTheme;
  }

  setTheme(theme: Theme): void {
    if (!['light', 'dark'].includes(theme)) {
      throw new ThemeError('Invalid theme');
    }

    this.currentTheme = theme;

    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    this.applyTheme();
  }

  toggleTheme(): void {
    if (this.currentTheme === 'light') {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
  }

  isDark(): boolean {
    return this.currentTheme === 'dark';
  }

  isLight(): boolean {
    return this.currentTheme === 'light';
  }

  addListener(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  async saveThemePreference(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const response = await fetch('/api/navigation/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' &&
            localStorage.getItem('auth_token') && {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            }),
        },
        body: JSON.stringify({
          theme: this.currentTheme,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save theme preference');
      }
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
      // Don't throw error as theme should still work locally
    }
  }

  async loadThemePreference(userId: string | null): Promise<void> {
    if (typeof window === 'undefined' || !userId) return;

    try {
      const response = await fetch('/api/navigation/theme', {
        headers: {
          ...(typeof window !== 'undefined' &&
            localStorage.getItem('auth_token') && {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.theme && ['light', 'dark'].includes(data.theme)) {
          this.setTheme(data.theme);
        }
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      // Continue with current theme
    }
  }

  getThemeConfig(): ThemeConfig {
    return THEME_CONFIG;
  }

  getCurrentThemeConfig(): Record<string, string> {
    return THEME_CONFIG[this.currentTheme];
  }
}

export const themeService = ThemeService.getInstance();

export const validateTheme = (theme: string): theme is Theme => {
  return ['light', 'dark'].includes(theme);
};

export const createThemeTransition = (duration: number = 300): string => {
  return `transition: background-color ${duration}ms ease-in-out, color ${duration}ms ease-in-out, border-color ${duration}ms ease-in-out;`;
};

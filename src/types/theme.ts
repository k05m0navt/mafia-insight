export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfiguration {
  id: string;
  userId: string;
  theme: Theme;
  customColors?: Record<string, string>;
  lastUpdated: Date;
}

export interface ThemeProviderContext {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

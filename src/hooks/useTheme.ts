'use client';

import { useTheme as useThemeContext } from '@/components/theme/ThemeProvider';

export function useTheme() {
  return useThemeContext();
}

// Re-export specific hooks for convenience
export {
  useEffectiveTheme,
  useIsDark,
  useIsLight,
  useIsSystemTheme,
  useThemeToggle,
} from '@/components/theme/ThemeProvider';

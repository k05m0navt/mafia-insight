import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/button';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component that uses theme
function ThemeTestComponent() {
  const { theme, setTheme, toggleTheme, isDark, isLight } = useTheme();

  return (
    <div>
      <div data-testid="theme-value">{theme}</div>
      <div data-testid="is-dark">{isDark.toString()}</div>
      <div data-testid="is-light">{isLight.toString()}</div>
      <Button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </Button>
      <Button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </Button>
      <Button onClick={toggleTheme} data-testid="toggle">
        Toggle
      </Button>
    </div>
  );
}

describe('Theme Switching', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset document classes
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.removeAttribute('data-theme');
  });

  describe('Theme Provider', () => {
    it('should initialize with default light theme', () => {
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
      expect(screen.getByTestId('is-light')).toHaveTextContent('true');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
    });

    it('should initialize with saved theme from localStorage', () => {
      localStorageMock.setItem('theme', 'dark');
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
    });

    it('should apply theme class to document root', async () => {
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('light');
        expect(document.documentElement).toHaveAttribute('data-theme', 'light');
      });
    });
  });

  describe('Theme Switching', () => {
    it('should switch to dark theme', async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      );

      const setDarkButton = screen.getByTestId('set-dark');
      await user.click(setDarkButton);

      await waitFor(() => {
        expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
        expect(document.documentElement).toHaveClass('dark');
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      });
    });

    it('should switch to light theme', async () => {
      const user = userEvent.setup();
      localStorageMock.setItem('theme', 'dark');
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      );

      const setLightButton = screen.getByTestId('set-light');
      await user.click(setLightButton);

      await waitFor(() => {
        expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
        expect(document.documentElement).toHaveClass('light');
      });
    });

    it('should toggle theme', async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByTestId('toggle');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
      });

      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
      });
    });
  });

  describe('Theme Persistence', () => {
    it('should save theme to localStorage when changed', async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      );

      const setDarkButton = screen.getByTestId('set-dark');
      await user.click(setDarkButton);

      await waitFor(() => {
        expect(localStorageMock.getItem('theme')).toBe('dark');
      });
    });

    it('should load theme from localStorage on mount', () => {
      localStorageMock.setItem('theme', 'dark');
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    });

    it('should persist theme across page reloads (simulated)', async () => {
      const user = userEvent.setup();
      const { unmount } = render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      );

      // Change theme
      const setDarkButton = screen.getByTestId('set-dark');
      await user.click(setDarkButton);
      await waitFor(() => {
        expect(localStorageMock.getItem('theme')).toBe('dark');
      });

      // Unmount (simulating page reload)
      unmount();

      // Remount (simulating page reload)
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      );

      // Theme should be persisted
      expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    });
  });

  describe('CSS Variables', () => {
    it('should apply theme class for CSS variable targeting', async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>
      );

      const root = document.documentElement;

      // Initial light theme
      expect(root).toHaveClass('light');
      expect(root).toHaveAttribute('data-theme', 'light');

      // Switch to dark
      const setDarkButton = screen.getByTestId('set-dark');
      await user.click(setDarkButton);

      await waitFor(() => {
        // Dark theme class should be applied (CSS variables are defined in globals.css)
        expect(root).toHaveClass('dark');
        expect(root).toHaveAttribute('data-theme', 'dark');
        // Light class should be removed
        expect(root).not.toHaveClass('light');
      });
    });
  });
});

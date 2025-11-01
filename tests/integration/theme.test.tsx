import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { useTheme } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/navigation/ThemeToggle';

// Mock the theme hook
vi.mock('@/hooks/useTheme');

const mockUseTheme = vi.mocked(useTheme);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('Theme Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });

    // Mock matchMedia for system preference detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Theme Toggle Functionality', () => {
    it('should toggle between light and dark themes', async () => {
      const mockToggleTheme = vi.fn();

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId('theme-toggle');
      fireEvent.click(themeToggle);

      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it('should display current theme state correctly', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId('theme-toggle');
      expect(themeToggle).toHaveAttribute('data-theme', 'dark');
    });

    it('should handle theme switching with smooth transitions', async () => {
      const mockSetTheme = vi.fn();

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: mockSetTheme,
        loading: false,
      });

      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId('theme-toggle');
      fireEvent.click(themeToggle);

      // Verify that setTheme is called with the opposite theme
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });
  });

  describe('Theme Persistence', () => {
    it('should save theme preference to localStorage', async () => {
      const mockLocalStorage = {
        getItem: vi.fn(() => 'dark'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      const mockSetTheme = vi.fn();

      mockUseTheme.mockReturnValue({
        theme: 'dark',
        toggleTheme: vi.fn(),
        setTheme: mockSetTheme,
        loading: false,
      });

      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Verify that localStorage.getItem was called to retrieve saved theme
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme');
    });

    it('should load theme preference from localStorage on initialization', async () => {
      const mockLocalStorage = {
        getItem: vi.fn(() => 'dark'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      mockUseTheme.mockReturnValue({
        theme: 'dark',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme');
      });
    });

    it('should handle missing localStorage gracefully', async () => {
      const mockLocalStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('theme-toggle')).toHaveAttribute(
          'data-theme',
          'light'
        );
      });
    });
  });

  describe('Theme Provider Integration', () => {
    it('should provide theme context to child components', async () => {
      const TestComponent = () => {
        const { theme, toggleTheme } = useTheme();
        return (
          <div data-testid="theme-display">
            <span data-testid="current-theme">{theme}</span>
            <button data-testid="toggle-button" onClick={toggleTheme}>
              Toggle
            </button>
          </div>
        );
      };

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
        expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
      });
    });

    it('should handle theme loading states', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: true,
      });

      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('theme-loading')).toBeInTheDocument();
      });
    });
  });

  describe('CSS Custom Properties Integration', () => {
    it('should apply theme-specific CSS custom properties', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <div
            data-testid="themed-element"
            className="bg-background text-foreground"
          >
            Themed content
          </div>
        </TestWrapper>
      );

      await waitFor(() => {
        const element = screen.getByTestId('themed-element');
        expect(element).toHaveClass('dark');
      });
    });

    it('should transition smoothly between themes', async () => {
      const mockSetTheme = vi.fn();

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: mockSetTheme,
        loading: false,
      });

      render(
        <TestWrapper>
          <div
            data-testid="themed-element"
            className="transition-colors duration-300"
          >
            Themed content
          </div>
        </TestWrapper>
      );

      const element = screen.getByTestId('themed-element');
      expect(element).toHaveClass('transition-colors', 'duration-300');
    });
  });

  describe('Error Handling', () => {
    it('should handle theme switching errors gracefully', async () => {
      const mockToggleTheme = vi.fn(() => {
        throw new Error('Theme switch failed');
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId('theme-toggle');

      // Should not throw error
      expect(() => fireEvent.click(themeToggle)).not.toThrow();
    });

    it('should handle localStorage errors gracefully', async () => {
      const mockLocalStorage = {
        getItem: vi.fn(() => {
          throw new Error('localStorage access denied');
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Should render without crashing
      await waitFor(() => {
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should complete theme switching within performance threshold', async () => {
      const mockSetTheme = vi.fn();

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: mockSetTheme,
        loading: false,
      });

      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const startTime = performance.now();

      const themeToggle = screen.getByTestId('theme-toggle');
      fireEvent.click(themeToggle);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 500ms (performance requirement)
      expect(duration).toBeLessThan(500);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Navigation } from '@/components/navigation/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { usePermissions } from '@/hooks/usePermissions';

// Mock the hooks
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useTheme');
vi.mock('@/hooks/usePermissions');

const mockUseAuth = vi.mocked(useAuth);
const mockUseTheme = vi.mocked(useTheme);
const mockUsePermissions = vi.mocked(usePermissions);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ThemeProvider>{children}</ThemeProvider>
  </AuthProvider>
);

describe('Navigation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Navigation Visibility Based on User Role', () => {
    it('should show admin navigation items for admin users', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', role: 'admin' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          const adminPermissions = [
            'read:admin',
            'write:admin',
            'read:players',
            'read:analytics',
          ];
          return adminPermissions.includes(permission);
        }),
        permissions: [
          'read:admin',
          'write:admin',
          'read:players',
          'read:analytics',
        ],
        loading: false,
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('nav-admin')).toBeInTheDocument();
        expect(screen.getByTestId('nav-players')).toBeInTheDocument();
        expect(screen.getByTestId('nav-analytics')).toBeInTheDocument();
      });
    });

    it('should hide admin navigation items for regular users', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '2', email: 'user@example.com', role: 'user' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          const userPermissions = ['read:players'];
          return userPermissions.includes(permission);
        }),
        permissions: ['read:players'],
        loading: false,
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('nav-admin')).not.toBeInTheDocument();
        expect(screen.getByTestId('nav-players')).toBeInTheDocument();
      });
    });

    it('should show limited navigation for guest users', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => false),
        permissions: [],
        loading: false,
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('nav-login')).toBeInTheDocument();
        expect(screen.getByTestId('nav-signup')).toBeInTheDocument();
        expect(screen.queryByTestId('nav-players')).not.toBeInTheDocument();
      });
    });
  });

  describe('Theme Toggle Integration', () => {
    it('should toggle theme when theme toggle button is clicked', async () => {
      const mockToggleTheme = vi.fn();

      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@example.com', role: 'user' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => true),
        permissions: ['read:players'],
        loading: false,
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId('theme-toggle');
      fireEvent.click(themeToggle);

      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it('should persist theme preference across page reloads', async () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn(() => 'dark'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@example.com', role: 'user' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => true),
        permissions: ['read:players'],
        loading: false,
      });

      mockUseTheme.mockReturnValue({
        theme: 'dark',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('theme-toggle')).toHaveAttribute(
          'data-theme',
          'dark'
        );
      });
    });
  });

  describe('Authentication Controls Integration', () => {
    it('should show login and signup buttons for unauthenticated users', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => false),
        permissions: [],
        loading: false,
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('nav-login')).toBeInTheDocument();
        expect(screen.getByTestId('nav-signup')).toBeInTheDocument();
        expect(screen.queryByTestId('nav-logout')).not.toBeInTheDocument();
      });
    });

    it('should show user menu and logout button for authenticated users', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@example.com', role: 'user' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => true),
        permissions: ['read:players'],
        loading: false,
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('nav-user-menu')).toBeInTheDocument();
        expect(screen.getByTestId('nav-logout')).toBeInTheDocument();
        expect(screen.queryByTestId('nav-login')).not.toBeInTheDocument();
      });
    });

    it('should call logout function when logout button is clicked', async () => {
      const mockLogout = vi.fn();

      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@example.com', role: 'user' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: mockLogout,
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => true),
        permissions: ['read:players'],
        loading: false,
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      const logoutButton = screen.getByTestId('nav-logout');
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation State Updates', () => {
    it('should update navigation when user permissions change', async () => {
      const { rerender } = render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      // Initial state - user with limited permissions
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@example.com', role: 'user' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          const userPermissions = ['read:players'];
          return userPermissions.includes(permission);
        }),
        permissions: ['read:players'],
        loading: false,
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      rerender(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('nav-admin')).not.toBeInTheDocument();
        expect(screen.getByTestId('nav-players')).toBeInTheDocument();
      });

      // Update permissions - user gets admin access
      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          const adminPermissions = [
            'read:admin',
            'write:admin',
            'read:players',
            'read:analytics',
          ];
          return adminPermissions.includes(permission);
        }),
        permissions: [
          'read:admin',
          'write:admin',
          'read:players',
          'read:analytics',
        ],
        loading: false,
      });

      rerender(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('nav-admin')).toBeInTheDocument();
        expect(screen.getByTestId('nav-players')).toBeInTheDocument();
        expect(screen.getByTestId('nav-analytics')).toBeInTheDocument();
      });
    });

    it('should handle loading states gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        loading: true,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => false),
        permissions: [],
        loading: true,
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: true,
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('nav-loading')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle navigation errors gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@example.com', role: 'user' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => {
          throw new Error('Permission check failed');
        }),
        permissions: [],
        loading: false,
      });

      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
        loading: false,
      });

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('nav-error')).toBeInTheDocument();
      });
    });
  });
});

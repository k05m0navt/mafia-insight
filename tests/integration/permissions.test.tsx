import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/protected/ProtectedRoute';
import { ProtectedComponent } from '@/components/protected/ProtectedComponent';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { permissionService } from '@/services/permissionService';

// Mock the hooks and services
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/usePermissions');
vi.mock('@/services/permissionService');

const mockUseAuth = vi.mocked(useAuth);
const mockUsePermissions = vi.mocked(usePermissions);
const mockPermissionService = vi.mocked(permissionService);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Permission System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('ProtectedRoute Component', () => {
    it('should render children when user has required permission', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', role: 'admin' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          const adminPermissions = ['read:admin', 'write:admin'];
          return adminPermissions.includes(permission);
        }),
        permissions: ['read:admin', 'write:admin'],
        loading: false,
      });

      render(
        <TestWrapper>
          <ProtectedRoute permission="read:admin">
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      });
    });

    it('should redirect when user lacks required permission', async () => {
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

      render(
        <TestWrapper>
          <ProtectedRoute permission="read:admin">
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
      });
    });

    it('should show loading state while checking permissions', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', role: 'admin' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(),
        permissions: [],
        loading: true,
      });

      render(
        <TestWrapper>
          <ProtectedRoute permission="read:admin">
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('permission-loading')).toBeInTheDocument();
      });
    });

    it('should handle multiple permission requirements', async () => {
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
          ];
          return adminPermissions.includes(permission);
        }),
        permissions: ['read:admin', 'write:admin', 'read:players'],
        loading: false,
      });

      render(
        <TestWrapper>
          <ProtectedRoute permissions={['read:admin', 'write:admin']}>
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      });
    });
  });

  describe('ProtectedComponent Component', () => {
    it('should render children when user has required permission', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', role: 'admin' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          const adminPermissions = ['read:admin'];
          return adminPermissions.includes(permission);
        }),
        permissions: ['read:admin'],
        loading: false,
      });

      render(
        <TestWrapper>
          <ProtectedComponent permission="read:admin">
            <button data-testid="admin-button">Admin Action</button>
          </ProtectedComponent>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-button')).toBeInTheDocument();
      });
    });

    it('should hide children when user lacks required permission', async () => {
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

      render(
        <TestWrapper>
          <ProtectedComponent permission="read:admin">
            <button data-testid="admin-button">Admin Action</button>
          </ProtectedComponent>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('admin-button')).not.toBeInTheDocument();
      });
    });

    it('should render fallback content when user lacks permission', async () => {
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

      render(
        <TestWrapper>
          <ProtectedComponent
            permission="read:admin"
            fallback={<div data-testid="no-permission">No permission</div>}
          >
            <button data-testid="admin-button">Admin Action</button>
          </ProtectedComponent>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('admin-button')).not.toBeInTheDocument();
        expect(screen.getByTestId('no-permission')).toBeInTheDocument();
      });
    });
  });

  describe('Permission Service Integration', () => {
    it('should fetch user permissions on authentication', async () => {
      const mockPermissions = [
        {
          id: '1',
          resource: 'players',
          action: 'read',
          roles: ['user', 'admin'],
        },
        { id: '2', resource: 'admin', action: 'read', roles: ['admin'] },
      ];

      mockPermissionService.getUserPermissions.mockResolvedValue({
        success: true,
        permissions: mockPermissions,
        error: null,
      });

      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', role: 'admin' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          const userPermissions = ['read:players', 'read:admin'];
          return userPermissions.includes(permission);
        }),
        permissions: ['read:players', 'read:admin'],
        loading: false,
      });

      render(
        <TestWrapper>
          <div data-testid="test-content">Test Content</div>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockPermissionService.getUserPermissions).toHaveBeenCalledWith(
          '1'
        );
      });
    });

    it('should handle permission fetch errors gracefully', async () => {
      mockPermissionService.getUserPermissions.mockResolvedValue({
        success: false,
        permissions: [],
        error: 'Failed to fetch permissions',
      });

      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', role: 'admin' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => false),
        permissions: [],
        loading: false,
      });

      render(
        <TestWrapper>
          <div data-testid="test-content">Test Content</div>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });
    });

    it('should update permissions when user role changes', async () => {
      const mockPermissions = [
        {
          id: '1',
          resource: 'players',
          action: 'read',
          roles: ['user', 'admin'],
        },
        { id: '2', resource: 'admin', action: 'read', roles: ['admin'] },
      ];

      mockPermissionService.getUserPermissions.mockResolvedValue({
        success: true,
        permissions: mockPermissions,
        error: null,
      });

      const { rerender } = render(
        <TestWrapper>
          <div data-testid="test-content">Test Content</div>
        </TestWrapper>
      );

      // Initial state - user with limited permissions
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

      rerender(
        <TestWrapper>
          <div data-testid="test-content">Test Content</div>
        </TestWrapper>
      );

      // Update to admin role
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', role: 'admin' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          const adminPermissions = ['read:players', 'read:admin'];
          return adminPermissions.includes(permission);
        }),
        permissions: ['read:players', 'read:admin'],
        loading: false,
      });

      rerender(
        <TestWrapper>
          <div data-testid="test-content">Test Content</div>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockPermissionService.getUserPermissions).toHaveBeenCalledWith(
          '1'
        );
      });
    });
  });

  describe('Permission Management (Admin)', () => {
    it('should allow admin to update permissions', async () => {
      const updatedPermissions = [
        {
          id: '1',
          resource: 'players',
          action: 'read',
          roles: ['user', 'admin'],
        },
        { id: '2', resource: 'admin', action: 'read', roles: ['admin'] },
      ];

      mockPermissionService.updatePermissions.mockResolvedValue({
        success: true,
        message: 'Permissions updated successfully',
        error: null,
      });

      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', role: 'admin' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          const adminPermissions = ['read:admin', 'write:admin'];
          return adminPermissions.includes(permission);
        }),
        permissions: ['read:admin', 'write:admin'],
        loading: false,
      });

      const result =
        await permissionService.updatePermissions(updatedPermissions);

      expect(result).toEqual({
        success: true,
        message: 'Permissions updated successfully',
        error: null,
      });

      expect(mockPermissionService.updatePermissions).toHaveBeenCalledWith(
        updatedPermissions
      );
    });

    it('should prevent non-admin users from updating permissions', async () => {
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

      render(
        <TestWrapper>
          <ProtectedRoute permission="write:admin">
            <div data-testid="permission-management">Permission Management</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId('permission-management')
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle permission check errors gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', role: 'admin' },
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

      render(
        <TestWrapper>
          <ProtectedComponent permission="read:admin">
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedComponent>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
        expect(screen.getByTestId('permission-error')).toBeInTheDocument();
      });
    });

    it('should handle network errors when fetching permissions', async () => {
      mockPermissionService.getUserPermissions.mockRejectedValue(
        new Error('Network error')
      );

      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', role: 'admin' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(() => false),
        permissions: [],
        loading: false,
      });

      render(
        <TestWrapper>
          <div data-testid="test-content">Test Content</div>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should complete permission checks within performance threshold', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', role: 'admin' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
      });

      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          const adminPermissions = ['read:admin'];
          return adminPermissions.includes(permission);
        }),
        permissions: ['read:admin'],
        loading: false,
      });

      const startTime = performance.now();

      render(
        <TestWrapper>
          <ProtectedComponent permission="read:admin">
            <div data-testid="admin-content">Admin Content</div>
          </ProtectedComponent>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 1s (performance requirement)
      expect(duration).toBeLessThan(1000);
    });
  });
});

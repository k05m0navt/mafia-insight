import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { RoleGuard } from '@/components/auth/RoleGuard';

type Role = 'guest' | 'user' | 'admin';

const mockRole = (role: Role, hasMinimumRoleImpl?: (r: Role) => boolean) => ({
  currentRole: role,
  hasMinimumRole:
    hasMinimumRoleImpl ||
    ((required: Role) => {
      const order: Role[] = ['guest', 'user', 'admin'];
      return order.indexOf(role) >= order.indexOf(required);
    }),
});

const mockUseRole = vi.fn();

vi.mock('@/hooks/useRole', () => ({
  useRole: () => mockUseRole(),
}));

beforeEach(() => {
  mockUseRole.mockReturnValue(mockRole('user'));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('RoleGuard', () => {
  it('renders children when role matches allowedRoles', () => {
    mockUseRole.mockReturnValue(mockRole('user'));
    render(
      <RoleGuard allowedRoles={['user'] as string[]}>
        <div>Protected</div>
      </RoleGuard>
    );
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('renders fallback when role is not allowed', () => {
    mockUseRole.mockReturnValue(mockRole('guest'));
    render(
      <RoleGuard
        allowedRoles={['admin'] as string[]}
        fallback={<div>Nope</div>}
      >
        <div>Hidden</div>
      </RoleGuard>
    );
    expect(screen.getByText('Nope')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('grants access when user has minimum required role level', () => {
    mockUseRole.mockReturnValue(mockRole('admin'));
    render(
      <RoleGuard allowedRoles={['user'] as string[]}>
        <div>Admin OK</div>
      </RoleGuard>
    );
    expect(screen.getByText('Admin OK')).toBeInTheDocument();
  });

  it('requireAll uses direct inclusion check', () => {
    mockUseRole.mockReturnValue(mockRole('user', () => false));
    render(
      <RoleGuard allowedRoles={['admin'] as string[]} requireAll>
        <div>Should Not See</div>
      </RoleGuard>
    );
    expect(screen.queryByText('Should Not See')).not.toBeInTheDocument();
  });
});

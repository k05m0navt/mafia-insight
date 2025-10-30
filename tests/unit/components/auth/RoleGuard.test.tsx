import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
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

jest.mock('@/hooks/useRole', () => ({ useRole: () => mockRole('user') }));

describe('RoleGuard', () => {
  it('renders children when role matches allowedRoles', () => {
    (
      jest.requireMock('@/hooks/useRole') as jest.MockedFunction<
        () => { role: string; loading: boolean }
      >
    ).useRole = () => mockRole('user');
    render(
      <RoleGuard allowedRoles={['user'] as string[]}>
        <div>Protected</div>
      </RoleGuard>
    );
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('renders fallback when role is not allowed', () => {
    (
      jest.requireMock('@/hooks/useRole') as jest.MockedFunction<
        () => { role: string; loading: boolean }
      >
    ).useRole = () => mockRole('guest');
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
    (
      jest.requireMock('@/hooks/useRole') as jest.MockedFunction<
        () => { role: string; loading: boolean }
      >
    ).useRole = () => mockRole('admin');
    render(
      <RoleGuard allowedRoles={['user'] as string[]}>
        <div>Admin OK</div>
      </RoleGuard>
    );
    expect(screen.getByText('Admin OK')).toBeInTheDocument();
  });

  it('requireAll uses direct inclusion check', () => {
    (
      jest.requireMock('@/hooks/useRole') as jest.MockedFunction<
        () => { role: string; loading: boolean }
      >
    ).useRole = () => mockRole('user', () => false);
    render(
      <RoleGuard allowedRoles={['admin'] as string[]} requireAll>
        <div>Should Not See</div>
      </RoleGuard>
    );
    expect(screen.queryByText('Should Not See')).not.toBeInTheDocument();
  });
});

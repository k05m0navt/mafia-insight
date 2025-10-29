import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProfile } from '@/components/auth/UserProfile';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  formatDistanceToNow: () => '3 days ago',
}));

const baseUser = {
  id: 'u1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  avatar: '',
  createdAt: new Date(),
  lastLoginAt: new Date(),
};

const mockUseAuth = (overrides: Record<string, unknown> = {}) => ({
  authState: { user: baseUser, isLoading: false, ...overrides },
});

const mockUseRole = (overrides: Record<string, unknown> = {}) => ({
  description: 'Standard user',
  isAdmin: false,
  isAuthenticated: true,
  currentRole: 'user',
  hasMinimumRole: () => false,
  ...overrides,
});

const mockUseSession = (overrides: Record<string, unknown> = {}) => ({
  session: {},
  isSessionValid: () => true,
  getTimeUntilExpiry: () => 3600, // seconds
  ...overrides,
});

jest.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));
jest.mock('@/hooks/useRole', () => ({ useRole: () => mockUseRole() }));
jest.mock('@/hooks/useSession', () => ({ useSession: () => mockUseSession() }));

describe('UserProfile', () => {
  it('shows loading state', () => {
    (
      jest.requireMock('@/hooks/useAuth') as jest.MockedFunction<
        () => { authState: { user: unknown; isLoading: boolean } }
      >
    ).useAuth = () => mockUseAuth({ isLoading: true });
    render(<UserProfile />);
    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  });

  it('shows not signed in state when no user', () => {
    (
      jest.requireMock('@/hooks/useAuth') as jest.MockedFunction<
        () => { authState: { user: unknown; isLoading: boolean } }
      >
    ).useAuth = () => ({ authState: { user: null, isLoading: false } });
    (
      jest.requireMock('@/hooks/useRole') as jest.MockedFunction<
        () => { isAuthenticated: boolean }
      >
    ).useRole = () => mockUseRole({ isAuthenticated: false });
    render(<UserProfile />);
    expect(screen.getByText(/not signed in/i)).toBeInTheDocument();
  });

  it('renders default variant with user details', () => {
    render(<UserProfile />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Standard user/i)).toBeInTheDocument();
    expect(screen.getByText(/Session expires in/i)).toBeInTheDocument();
  });

  it('renders compact variant', () => {
    render(<UserProfile variant="compact" />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('renders detailed variant with role and timestamps', () => {
    render(<UserProfile variant="detailed" />);
    expect(screen.getByText('User Profile')).toBeInTheDocument();
    expect(screen.getByText(/Member since/i)).toBeInTheDocument();
    expect(screen.getByText(/Last login/i)).toBeInTheDocument();
    expect(screen.getByText(/Standard user/i)).toBeInTheDocument();
  });

  it('shows admin badge when isAdmin', () => {
    (
      jest.requireMock('@/hooks/useRole') as jest.MockedFunction<
        () => { isAuthenticated: boolean }
      >
    ).useRole = () => mockUseRole({ isAdmin: true });
    render(<UserProfile />);
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });
});

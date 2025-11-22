import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { UserProfile } from '@/components/auth/UserProfile';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('date-fns', async () => {
  const actual = await vi.importActual<typeof import('date-fns')>('date-fns');
  return {
    ...actual,
    formatDistanceToNow: () => '3 days ago',
  };
});

const baseUser = {
  id: 'u1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  avatar: '',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  lastLogin: new Date('2024-01-05T00:00:00Z'),
};

const createAuthValue = (overrides: Record<string, unknown> = {}) => ({
  user: baseUser,
  isLoading: false,
  ...overrides,
});

const createRoleValue = (overrides: Record<string, unknown> = {}) => ({
  description: 'Standard user',
  isAdmin: false,
  isAuthenticated: true,
  currentRole: 'user',
  hasMinimumRole: () => false,
  ...overrides,
});

const createSessionValue = (overrides: Record<string, unknown> = {}) => ({
  token: 'mock-token',
  expiresAt: new Date(Date.now() + 3600_000),
  isValid: true,
  isExpired: () => false,
  needsRefresh: () => false,
  refreshSession: vi.fn(),
  ...overrides,
});

const mockUseAuth = vi.fn();
const mockUseRole = vi.fn();
const mockUseSession = vi.fn();

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));
vi.mock('@/hooks/useRole', () => ({ useRole: () => mockUseRole() }));
vi.mock('@/hooks/useSession', () => ({ useSession: () => mockUseSession() }));

beforeEach(() => {
  mockUseAuth.mockReturnValue(createAuthValue());
  mockUseRole.mockReturnValue(createRoleValue());
  mockUseSession.mockReturnValue(createSessionValue());
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('UserProfile', () => {
  it('shows loading state', () => {
    mockUseAuth.mockReturnValue(createAuthValue({ isLoading: true }));
    const { container } = render(<UserProfile />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows not signed in state when no user', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    mockUseRole.mockReturnValue(createRoleValue({ isAuthenticated: false }));
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
    mockUseRole.mockReturnValue(createRoleValue({ isAdmin: true }));
    render(<UserProfile />);
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });
});

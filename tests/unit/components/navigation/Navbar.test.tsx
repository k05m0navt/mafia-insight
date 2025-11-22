/**
 * Tests for Navbar component
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Navbar } from '@/components/navigation/Navbar';
import type { ReactElement } from 'react';

const defaultAuthState = {
  isAuthenticated: true,
  user: { id: '1', email: 'test@example.com', role: 'user' },
};

const { useAuthStoreMock, usePermissionsMock, useMobileMenuMock } = vi.hoisted(
  () => ({
    useAuthStoreMock: vi.fn(),
    usePermissionsMock: vi.fn(),
    useMobileMenuMock: vi.fn(),
  })
);

vi.mock('@/store/authStore', () => ({
  useAuthStore: useAuthStoreMock,
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: usePermissionsMock,
}));

vi.mock('@/hooks/useMobileMenu', () => ({
  useMobileMenu: useMobileMenuMock,
}));

vi.mock('@/components/navigation/NavItem', () => ({
  NavItem: ({
    label,
    path,
    'data-testid': dataTestId,
    onClick,
  }: {
    label: string;
    path: string;
    'data-testid'?: string;
    onClick?: () => void;
  }) => (
    <a href={path} data-testid={dataTestId} onClick={onClick}>
      {label}
    </a>
  ),
}));

vi.mock('@/components/navigation/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">theme</button>,
}));

vi.mock('@/components/navigation/AuthControls', () => ({
  AuthControls: ({ mobile }: { mobile?: boolean }) => (
    <div data-testid={mobile ? 'auth-controls-mobile' : 'auth-controls'}>
      auth
    </div>
  ),
}));

vi.mock('@/components/sync/SyncNotifications', () => ({
  SyncNotifications: () => <div data-testid="sync-notifications">sync</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...rest }: any) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: { children: ReactElement; open?: boolean }) => (
    <div data-testid="sheet" data-open={open}>
      {children}
    </div>
  ),
  SheetContent: ({ children, ...rest }: any) => (
    <div data-testid="sheet-content" {...rest}>
      {children}
    </div>
  ),
  SheetTrigger: ({ children }: any) => (
    <div data-testid="sheet-trigger">{children}</div>
  ),
  SheetTitle: ({ children }: any) => (
    <div data-testid="sheet-title">{children}</div>
  ),
}));

vi.mock('@/components/ui/visually-hidden', () => ({
  VisuallyHidden: ({ children }: any) => (
    <div data-testid="visually-hidden">{children}</div>
  ),
}));

vi.mock('lucide-react', () => ({
  Menu: () => <span data-testid="menu-icon">menu</span>,
}));

beforeEach(() => {
  useAuthStoreMock.mockImplementation(
    (selector?: (state: typeof defaultAuthState) => unknown) =>
      selector ? selector(defaultAuthState) : defaultAuthState
  );
  usePermissionsMock.mockReturnValue({
    canAccessPage: () => true,
    isLoading: false,
  });
  useMobileMenuMock.mockReturnValue({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
  });
});

describe('Navbar Component', () => {
  it('renders without crashing', () => {
    render(<Navbar />);

    expect(
      screen.getByRole('navigation', { name: 'Main navigation' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Mafia Insight')[0]).toBeInTheDocument();
  });

  it('renders desktop navigation items', () => {
    render(<Navbar />);

    expect(screen.getByTestId('nav-home-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('nav-players-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('nav-games-desktop')).toBeInTheDocument();
  });

  it('renders mobile menu button with accessible label', () => {
    render(<Navbar />);

    const button = screen.getByTestId('mobile-menu-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Open navigation menu');
  });

  it('includes navigation logo linking to home', () => {
    render(<Navbar />);

    const logoLink = screen.getByTestId('nav-logo');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('toggles mobile menu when button is clicked', () => {
    const toggleSpy = vi.fn();
    useMobileMenuMock.mockReturnValue({
      isOpen: false,
      open: vi.fn(),
      close: vi.fn(),
      toggle: toggleSpy,
    });

    render(<Navbar />);

    fireEvent.click(screen.getByTestId('mobile-menu-button'));
    expect(toggleSpy).toHaveBeenCalledTimes(1);
  });

  it('closes mobile menu when navigation item is clicked', () => {
    const closeSpy = vi.fn();
    useMobileMenuMock.mockReturnValue({
      isOpen: true,
      open: vi.fn(),
      close: closeSpy,
      toggle: vi.fn(),
    });

    render(<Navbar />);

    fireEvent.click(screen.getByTestId('mobile-menu-button'));
    fireEvent.click(screen.getByTestId('nav-home-mobile'));

    expect(closeSpy).toHaveBeenCalled();
  });

  it('merges custom class names', () => {
    render(<Navbar className="custom-class" />);

    expect(screen.getByTestId('navbar')).toHaveClass('custom-class');
  });

  it('filters navigation items based on permissions', () => {
    const canAccessPage = vi.fn(
      (path: string) => path === '/' || path === '/players'
    );
    usePermissionsMock.mockReturnValue({
      canAccessPage,
      isLoading: false,
    });

    render(<Navbar />);

    expect(screen.getByTestId('nav-home-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('nav-players-desktop')).toBeInTheDocument();
    expect(screen.queryByTestId('nav-admin-desktop')).not.toBeInTheDocument();
  });

  it('shows admin navigation when user has admin role', () => {
    useAuthStoreMock.mockImplementation(
      (selector?: (state: typeof defaultAuthState) => unknown) =>
        selector
          ? selector({
              isAuthenticated: true,
              user: { id: '1', email: 'admin@example.com', role: 'admin' },
            })
          : {
              isAuthenticated: true,
              user: { id: '1', email: 'admin@example.com', role: 'admin' },
            }
    );

    render(<Navbar />);

    expect(screen.getByTestId('nav-admin-desktop')).toBeInTheDocument();
  });

  it('exposes sheet structure for mobile menu', () => {
    render(<Navbar />);

    const sheet = screen.getByTestId('sheet');
    expect(sheet).toBeInTheDocument();
    expect(within(sheet).getByTestId('sheet-trigger')).toBeInTheDocument();
    expect(within(sheet).getByTestId('sheet-content')).toBeInTheDocument();
  });
});

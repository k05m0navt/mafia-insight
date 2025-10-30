/**
 * Tests for Navbar component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '@/components/navigation/Navbar';
import { useMobileMenu } from '@/hooks/useMobileMenu';
import { usePermissions } from '@/hooks/usePermissions';

// Mock the hooks
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    authState: {
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com', role: 'user' },
    },
  }),
}));

vi.mock('@/components/theme/ThemeProvider', () => ({
  useTheme: () => ({
    theme: 'light',
  }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(() => ({
    canAccessPage: vi.fn(() => true),
  })),
}));

vi.mock('@/hooks/useMobileMenu', () => ({
  useMobileMenu: vi.fn(() => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
  })),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div
      data-testid="sheet"
      data-open={open}
      data-on-open-change={onOpenChange}
    >
      {children}
    </div>
  ),
  SheetContent: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid="sheet-content" {...props}>
      {children}
    </div>
  ),
  SheetTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (
    <div data-testid="sheet-trigger" data-as-child={asChild}>
      {children}
    </div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-title">{children}</div>
  ),
}));

vi.mock('@/components/ui/visually-hidden', () => ({
  VisuallyHidden: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="visually-hidden">{children}</div>
  ),
}));

vi.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu</div>,
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render without crashing', () => {
    render(<Navbar />);

    expect(screen.getAllByRole('navigation')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Mafia Insight')[0]).toBeInTheDocument();
  });

  it('should render desktop navigation items', () => {
    render(<Navbar />);

    // Check that desktop navigation is visible
    const desktopNav = screen
      .getAllByRole('navigation')[0]
      .querySelector('.hidden.md\\:flex');
    expect(desktopNav).toBeInTheDocument();
  });

  it('should render mobile menu button', () => {
    render(<Navbar />);

    const mobileMenuButton = screen.getByTestId('mobile-menu-button');
    expect(mobileMenuButton).toBeInTheDocument();
    expect(mobileMenuButton).toHaveAttribute(
      'aria-label',
      'Open navigation menu'
    );
  });

  it('should render navigation items with correct test IDs', () => {
    render(<Navbar />);

    // Check for navigation items
    expect(screen.getByTestId('nav-home-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('nav-players-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('nav-tournaments-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('nav-clubs-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('nav-games-desktop')).toBeInTheDocument();
  });

  it('should not render duplicate close buttons', () => {
    render(<Navbar />);

    // Check that there's only one close button (from Sheet component)
    const closeButtons = screen.queryAllByLabelText(/close/i);
    expect(closeButtons).toHaveLength(0); // No custom close buttons

    // Check that Sheet component is present
    expect(screen.getByTestId('sheet')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<Navbar />);

    const nav = screen.getAllByRole('navigation')[0];
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');

    const mobileMenuButton = screen.getByTestId('mobile-menu-button');
    expect(mobileMenuButton).toHaveAttribute(
      'aria-label',
      'Open navigation menu'
    );
  });

  it('should render logo with correct link', () => {
    render(<Navbar />);

    const logoLink = screen.getAllByText('Mafia Insight')[0].closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('should handle mobile menu toggle', () => {
    const mockToggle = vi.fn();
    const useMobileMenuMock = vi.mocked(useMobileMenu);
    useMobileMenuMock.mockReturnValue({
      isOpen: false,
      open: vi.fn(),
      close: vi.fn(),
      toggle: mockToggle,
    });

    render(<Navbar />);

    const mobileMenuButton = screen.getByTestId('mobile-menu-button');
    fireEvent.click(mobileMenuButton);

    expect(mockToggle).toHaveBeenCalled();
  });

  it('should close mobile menu when navigation item is clicked', () => {
    const mockClose = vi.fn();
    const useMobileMenuMock = vi.mocked(useMobileMenu);
    useMobileMenuMock.mockReturnValue({
      isOpen: true,
      open: vi.fn(),
      close: mockClose,
      toggle: vi.fn(),
    });

    render(<Navbar />);

    // Open mobile menu first
    const mobileMenuButton = screen.getByTestId('mobile-menu-button');
    fireEvent.click(mobileMenuButton);

    // Find a mobile navigation item and click it
    const homeLink = screen.getByTestId('nav-home-mobile');
    fireEvent.click(homeLink);

    expect(mockClose).toHaveBeenCalled();
  });

  it('should render with custom className', () => {
    render(<Navbar className="custom-class" />);

    const nav = screen.getAllByRole('navigation')[0];
    expect(nav).toHaveClass('custom-class');
  });

  it('should filter navigation items based on permissions', () => {
    const mockCanAccessPage = vi.fn((pageId: string) => {
      // Only allow home and players
      return pageId === 'home' || pageId === 'players';
    });

    const usePermissionsMock = vi.mocked(usePermissions);
    usePermissionsMock.mockReturnValue({
      canAccessPage: mockCanAccessPage,
    });

    render(<Navbar />);

    // Check that only allowed items are rendered
    expect(screen.getByTestId('nav-home-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('nav-players-desktop')).toBeInTheDocument();

    // Check that restricted items are not rendered
    expect(screen.queryByTestId('nav-admin')).not.toBeInTheDocument();
  });
});

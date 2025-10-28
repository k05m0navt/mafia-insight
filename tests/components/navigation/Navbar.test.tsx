/**
 * Tests for Navbar component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Navbar } from '@/components/navigation/Navbar';

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
  usePermissions: () => ({
    canAccessPage: vi.fn(() => true),
  }),
}));

vi.mock('@/hooks/useMobileMenu', () => ({
  useMobileMenu: () => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
  }),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open, onOpenChange }: any) => (
    <div
      data-testid="sheet"
      data-open={open}
      data-on-open-change={onOpenChange}
    >
      {children}
    </div>
  ),
  SheetContent: ({ children, ...props }: any) => (
    <div data-testid="sheet-content" {...props}>
      {children}
    </div>
  ),
  SheetTrigger: ({ children, asChild }: any) => (
    <div data-testid="sheet-trigger" data-as-child={asChild}>
      {children}
    </div>
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

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Mafia Insight')).toBeInTheDocument();
  });

  it('should render desktop navigation items', () => {
    render(<Navbar />);

    // Check that desktop navigation is visible
    const desktopNav = screen
      .getByRole('navigation')
      .querySelector('.hidden.md\\:block');
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
    expect(screen.getByTestId('nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-players')).toBeInTheDocument();
    expect(screen.getByTestId('nav-tournaments')).toBeInTheDocument();
    expect(screen.getByTestId('nav-clubs')).toBeInTheDocument();
    expect(screen.getByTestId('nav-games')).toBeInTheDocument();
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

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');

    const mobileMenuButton = screen.getByTestId('mobile-menu-button');
    expect(mobileMenuButton).toHaveAttribute(
      'aria-label',
      'Open navigation menu'
    );
  });

  it('should render logo with correct link', () => {
    render(<Navbar />);

    const logoLink = screen.getByText('Mafia Insight').closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('should handle mobile menu toggle', () => {
    const mockToggle = vi.fn();
    vi.mocked(require('@/hooks/useMobileMenu').useMobileMenu).mockReturnValue({
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
    vi.mocked(require('@/hooks/useMobileMenu').useMobileMenu).mockReturnValue({
      isOpen: true,
      open: vi.fn(),
      close: mockClose,
      toggle: vi.fn(),
    });

    render(<Navbar />);

    // Find a navigation item and click it
    const homeLink = screen.getByTestId('nav-home');
    fireEvent.click(homeLink);

    expect(mockClose).toHaveBeenCalled();
  });

  it('should render with custom className', () => {
    render(<Navbar className="custom-class" />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('custom-class');
  });

  it('should filter navigation items based on permissions', () => {
    const mockCanAccessPage = vi.fn((pageId: string) => {
      // Only allow home and players
      return pageId === 'home' || pageId === 'players';
    });

    vi.mocked(require('@/hooks/usePermissions').usePermissions).mockReturnValue(
      {
        canAccessPage: mockCanAccessPage,
      }
    );

    render(<Navbar />);

    // Check that only allowed items are rendered
    expect(screen.getByTestId('nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-players')).toBeInTheDocument();

    // Check that restricted items are not rendered
    expect(screen.queryByTestId('nav-admin')).not.toBeInTheDocument();
  });
});

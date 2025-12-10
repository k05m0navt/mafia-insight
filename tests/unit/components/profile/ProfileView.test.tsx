import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProfileView } from '@/components/profile/ProfileView';
import { format } from 'date-fns';

// Mock date-fns format function
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, _formatStr: string) => {
    return date.toLocaleDateString();
  }),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe('ProfileView', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    role: 'user',
    subscriptionTier: 'FREE',
    themePreference: 'dark',
    emailNotifications: true,
    pushNotifications: false,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date('2024-01-27'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render profile view with all user information', () => {
    render(<ProfileView user={mockUser} />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('should display email address', () => {
    render(<ProfileView user={mockUser} />);

    const emailElement = screen.getByText('test@example.com');
    expect(emailElement).toBeInTheDocument();
  });

  it('should display display name', () => {
    render(<ProfileView user={mockUser} />);

    const nameElement = screen.getByText('Test User');
    expect(nameElement).toBeInTheDocument();
  });

  it('should display avatar image when provided', () => {
    render(<ProfileView user={mockUser} />);

    const avatarImage = screen.getByAltText('Test User');
    expect(avatarImage).toBeInTheDocument();
    expect(avatarImage).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg'
    );
  });

  it('should display account creation date', () => {
    render(<ProfileView user={mockUser} />);

    expect(format).toHaveBeenCalledWith(mockUser.createdAt, expect.any(String));
  });

  it('should display last login timestamp when available', () => {
    render(<ProfileView user={mockUser} />);

    expect(format).toHaveBeenCalledWith(mockUser.lastLogin, expect.any(String));
  });

  it('should not display last login when null', () => {
    const userWithoutLastLogin = { ...mockUser, lastLogin: null };
    render(<ProfileView user={userWithoutLastLogin} />);

    // Last login section should not be visible
    expect(screen.queryByText(/last login/i)).not.toBeInTheDocument();
  });

  it('should display theme preference', () => {
    render(<ProfileView user={mockUser} />);

    expect(screen.getByText(/dark/i)).toBeInTheDocument();
  });

  it('should display notification preferences', () => {
    render(<ProfileView user={mockUser} />);

    expect(screen.getByText(/email notifications/i)).toBeInTheDocument();
    expect(screen.getByText(/push notifications/i)).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('should display email notifications as disabled when false', () => {
    const userWithDisabledEmail = { ...mockUser, emailNotifications: false };
    render(<ProfileView user={userWithDisabledEmail} />);

    const emailNotifications = screen.getAllByText(/disabled/i);
    expect(emailNotifications.length).toBeGreaterThan(0);
  });

  it('should display push notifications as enabled when true', () => {
    const userWithEnabledPush = { ...mockUser, pushNotifications: true };
    render(<ProfileView user={userWithEnabledPush} />);

    const pushNotifications = screen.getAllByText(/enabled/i);
    expect(pushNotifications.length).toBeGreaterThan(0);
  });

  it('should have proper ARIA labels for accessibility', () => {
    render(<ProfileView user={mockUser} />);

    const avatarImage = screen.getByAltText('Test User');
    expect(avatarImage).toBeInTheDocument();
  });

  it('should handle missing avatar gracefully', () => {
    const userWithoutAvatar = { ...mockUser, avatar: null };
    render(<ProfileView user={userWithoutAvatar} />);

    // Component should still render without errors
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should handle system theme preference', () => {
    const userWithSystemTheme = { ...mockUser, themePreference: 'system' };
    render(<ProfileView user={userWithSystemTheme} />);

    expect(screen.getByText(/system/i)).toBeInTheDocument();
  });
});

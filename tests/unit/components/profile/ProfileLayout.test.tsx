import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProfileLayout } from '@/components/profile/ProfileLayout';

// Mock ProfileView and ProfileEditForm components
vi.mock('@/components/profile/ProfileView', () => ({
  ProfileView: ({ user }: { user: any }) => (
    <div data-testid="profile-view">ProfileView: {user.name}</div>
  ),
}));

vi.mock('@/components/profile/ProfileEditForm', () => ({
  ProfileEditForm: ({ user }: { user: any }) => (
    <div data-testid="profile-edit-form">ProfileEditForm: {user.name}</div>
  ),
}));

describe('ProfileLayout', () => {
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

  it('should render profile layout with header', () => {
    render(<ProfileLayout user={mockUser} />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(
      screen.getByText(/manage your account information/i)
    ).toBeInTheDocument();
  });

  it('should render ProfileView component', () => {
    render(<ProfileLayout user={mockUser} />);

    expect(screen.getByTestId('profile-view')).toBeInTheDocument();
    expect(screen.getByText('ProfileView: Test User')).toBeInTheDocument();
  });

  it('should render ProfileEditForm component', () => {
    render(<ProfileLayout user={mockUser} />);

    expect(screen.getByTestId('profile-edit-form')).toBeInTheDocument();
    expect(screen.getByText('ProfileEditForm: Test User')).toBeInTheDocument();
  });

  it('should have responsive grid layout classes', () => {
    const { container } = render(<ProfileLayout user={mockUser} />);

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-3');
  });

  it('should pass user prop to ProfileView', () => {
    render(<ProfileLayout user={mockUser} />);

    const profileView = screen.getByTestId('profile-view');
    expect(profileView).toHaveTextContent('Test User');
  });

  it('should pass user prop to ProfileEditForm', () => {
    render(<ProfileLayout user={mockUser} />);

    const profileEditForm = screen.getByTestId('profile-edit-form');
    expect(profileEditForm).toHaveTextContent('Test User');
  });

  it('should have container with max width', () => {
    const { container } = render(<ProfileLayout user={mockUser} />);

    const mainContainer = container.querySelector('.container');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('max-w-6xl');
  });

  it('should have responsive padding', () => {
    const { container } = render(<ProfileLayout user={mockUser} />);

    const mainContainer = container.querySelector('.container');
    expect(mainContainer).toHaveClass('px-4', 'py-6', 'sm:py-8');
  });

  it('should render with semantic HTML structure', () => {
    const { container } = render(<ProfileLayout user={mockUser} />);

    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header?.querySelector('h1')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';

// Mock hooks
const mockUpdateProfile = vi.fn();
const mockProfile = null;
const mockIsProfileLoading = false;

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: mockProfile,
    updateProfile: mockUpdateProfile,
    isLoading: mockIsProfileLoading,
  }),
}));

// Mock Next.js router
const routerRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: routerRefresh,
  }),
}));

// Mock toast
const toastMock = vi.fn();
vi.mock('@/components/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

// Mock AvatarUpload component
vi.mock('@/components/profile/AvatarUpload', () => ({
  AvatarUpload: ({ userName }: { userName: string }) => (
    <div data-testid="avatar-upload">Avatar Upload for {userName}</div>
  ),
}));

// Mock fetch for email change request
global.fetch = vi.fn();

describe('ProfileEditForm', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    themePreference: 'dark',
    emailNotifications: true,
    pushNotifications: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateProfile.mockResolvedValue({ success: true });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should render profile edit form with all fields', () => {
    render(<ProfileEditForm user={mockUser} />);

    expect(screen.getByText('Profile Picture')).toBeInTheDocument();
    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
  });

  it('should display email field as read-only initially', () => {
    render(<ProfileEditForm user={mockUser} />);

    const emailInput = screen.getByDisplayValue('test@example.com');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('readOnly');
  });

  it('should allow editing email when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfileEditForm user={mockUser} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    await waitFor(() => {
      const emailInput = screen.getByDisplayValue('test@example.com');
      expect(emailInput).not.toHaveAttribute('readOnly');
    });
  });

  it('should display name field as editable', () => {
    render(<ProfileEditForm user={mockUser} />);

    const nameInput = screen.getByDisplayValue('Test User');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).not.toHaveAttribute('readOnly');
  });

  it('should display theme preference selector', () => {
    render(<ProfileEditForm user={mockUser} />);

    expect(screen.getByText(/theme preference/i)).toBeInTheDocument();
  });

  it('should display notification settings toggles', () => {
    render(<ProfileEditForm user={mockUser} />);

    expect(screen.getByText(/email notifications/i)).toBeInTheDocument();
    expect(screen.getByText(/push notifications/i)).toBeInTheDocument();
  });

  it('should validate name field minimum length', async () => {
    const user = userEvent.setup();
    render(<ProfileEditForm user={mockUser} />);

    const nameInput = screen.getByDisplayValue('Test User');
    await user.clear(nameInput);
    await user.type(nameInput, 'A');

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/must be at least 2 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('should validate name field maximum length', async () => {
    const user = userEvent.setup();
    render(<ProfileEditForm user={mockUser} />);

    const nameInput = screen.getByDisplayValue('Test User');
    await user.clear(nameInput);
    await user.type(nameInput, 'A'.repeat(51));

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/must be at most 50 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<ProfileEditForm user={mockUser} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    await waitFor(async () => {
      const emailInput = screen.getByDisplayValue('test@example.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', {
        name: /save changes/i,
      });
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(<ProfileEditForm user={mockUser} />);

    const nameInput = screen.getByDisplayValue('Test User');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Updated Name',
        themePreference: 'dark',
        emailNotifications: true,
        pushNotifications: false,
      });
    });
  });

  it('should show success toast on successful update', async () => {
    const user = userEvent.setup();
    render(<ProfileEditForm user={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        })
      );
    });
  });

  it('should show error toast on failed update', async () => {
    mockUpdateProfile.mockResolvedValue({
      success: false,
      error: 'Update failed',
    });

    const user = userEvent.setup();
    render(<ProfileEditForm user={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Update Failed',
          variant: 'destructive',
        })
      );
    });
  });

  it('should trigger email change flow when email is changed', async () => {
    const user = userEvent.setup();
    render(<ProfileEditForm user={mockUser} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    await waitFor(async () => {
      const emailInput = screen.getByDisplayValue('test@example.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'newemail@example.com');

      const submitButton = screen.getByRole('button', {
        name: /save changes/i,
      });
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/profile/email/request',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ newEmail: 'newemail@example.com' }),
        })
      );
    });
  });

  it('should render AvatarUpload component', () => {
    render(<ProfileEditForm user={mockUser} />);

    expect(screen.getByTestId('avatar-upload')).toBeInTheDocument();
    expect(screen.getByText('Avatar Upload for Test User')).toBeInTheDocument();
  });

  it('should handle loading state during submission', async () => {
    mockUpdateProfile.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    const user = userEvent.setup();
    render(<ProfileEditForm user={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    // Button should be disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});

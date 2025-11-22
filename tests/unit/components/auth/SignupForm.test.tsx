import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/services/AuthService', () => ({
  authService: {
    register: vi.fn(),
  },
}));

import { SignupForm } from '@/components/auth/SignupForm';
import { authService } from '@/services/AuthService';

const renderComponent = () => render(<SignupForm />);

describe('SignupForm', () => {
  const registerMock = vi.mocked(authService.register);

  beforeEach(() => {
    vi.clearAllMocks();
    registerMock.mockReset();
    registerMock.mockResolvedValue({ success: true });
  });

  it('should render signup form with email, password, and confirm password fields', () => {
    renderComponent();

    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('password')).toBeInTheDocument();
    expect(screen.getByTestId('confirmPassword')).toBeInTheDocument();
    expect(screen.getByTestId('signup-button')).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    renderComponent();

    const signupButton = screen.getByTestId('signup-button');
    fireEvent.click(signupButton);

    await waitFor(() => {
      const validationContainer = screen.getByTestId('validation-error');
      expect(
        within(validationContainer).getByText('Email is required')
      ).toBeInTheDocument();
      expect(
        within(validationContainer).getByText('Password is required')
      ).toBeInTheDocument();
      expect(
        within(validationContainer).getByText('Confirm password is required')
      ).toBeInTheDocument();
    });

    expect(registerMock).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid email format', async () => {
    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'invalid-email@domain' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      const validationContainer = screen.getByTestId('validation-error');
      expect(
        within(validationContainer).getByText('Invalid email format')
      ).toBeInTheDocument();
    });

    expect(registerMock).not.toHaveBeenCalled();
  });

  it('should show validation error for password mismatch', async () => {
    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'differentpassword' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      const validationContainer = screen.getByTestId('validation-error');
      expect(
        within(validationContainer).getByText('Passwords do not match')
      ).toBeInTheDocument();
    });
  });

  it('should show validation error for weak password', async () => {
    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
    fireEvent.click(signupButton);

    await waitFor(() => {
      const validationContainer = screen.getByTestId('validation-error');
      expect(
        within(validationContainer).getByText(
          /Password must be at least 8 characters long/
        )
      ).toBeInTheDocument();
    });
  });

  it('should show loading state during signup', async () => {
    registerMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123' },
    });
    fireEvent.click(signupButton);

    expect(await screen.findByTestId('loading')).toBeInTheDocument();
    await waitFor(() => {
      expect(signupButton).toBeDisabled();
    });
  });

  it('should disable form fields during signup', async () => {
    registerMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
    });
  });

  it('should show error message on signup failure', async () => {
    registerMock.mockResolvedValue({
      success: false,
      error: 'Email already exists',
    });

    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Email already exists'
      );
    });
  });

  it('should clear error when user starts typing', async () => {
    registerMock.mockResolvedValue({
      success: false,
      error: 'Email already exists',
    });

    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    await waitFor(() => {
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  it('should call signup service with correct credentials', async () => {
    registerMock.mockResolvedValue({
      user: {
        id: '1',
        email: 'user@example.com',
        role: 'user',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'token123',
      success: true,
    });

    renderComponent();

    const nameInput = screen.getByTestId('name');
    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
    });
  });

  it('should be accessible with proper ARIA labels', () => {
    renderComponent();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it('should support keyboard navigation', async () => {
    renderComponent();

    const nameInput = screen.getByTestId('name');
    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    nameInput.focus();
    expect(document.activeElement).toBe(nameInput);

    const user = userEvent.setup();
    await user.tab();
    expect(document.activeElement).toBe(emailInput);

    await user.tab();
    expect(document.activeElement).toBe(passwordInput);

    await user.tab();
    expect(document.activeElement).toBe(confirmPasswordInput);

    await user.tab();
    expect(document.activeElement).toBe(signupButton);
  });
});

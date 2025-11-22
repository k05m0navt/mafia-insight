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
    login: vi.fn(),
  },
}));

import { LoginForm } from '@/components/auth/LoginForm';
import { authService } from '@/services/AuthService';

const routerPush = vi.fn();
const routerReplace = vi.fn();
const routerPrefetch = vi.fn();
const routerBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPush,
    replace: routerReplace,
    prefetch: routerPrefetch,
    back: routerBack,
  }),
}));

const toastMock = vi.fn();
const dismissMock = vi.fn();

vi.mock('@/components/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
    dismiss: dismissMock,
    toasts: [],
  }),
}));

const renderComponent = () => render(<LoginForm />);

describe('LoginForm', () => {
  const loginMock = vi.mocked(authService.login);

  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockReset();
    loginMock.mockResolvedValue({ success: true });
    routerPush.mockReset();
    routerReplace.mockReset();
    routerPrefetch.mockReset();
    routerBack.mockReset();
    toastMock.mockReset();
    dismissMock.mockReset();
  });

  it('should render login form with email and password fields', () => {
    renderComponent();

    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('password')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    renderComponent();

    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);

    await waitFor(() => {
      const validationContainer = screen.getByTestId('validation-error');
      expect(
        within(validationContainer).getByText('Email is required')
      ).toBeInTheDocument();
      expect(
        within(validationContainer).getByText('Password is required')
      ).toBeInTheDocument();
      expect(screen.getAllByText('Email is required')).toHaveLength(2);
    });

    expect(loginMock).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid email format', async () => {
    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'invalid-email@domain' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      const validationContainer = screen.getByTestId('validation-error');
      expect(
        within(validationContainer).getByText(/Invalid email/i)
      ).toBeInTheDocument();
    });

    expect(loginMock).not.toHaveBeenCalled();
  });

  it('should show loading state during login', async () => {
    loginMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    expect(await screen.findByTestId('loading')).toBeInTheDocument();
    await waitFor(() => {
      expect(loginButton).toBeDisabled();
    });
  });

  it('should disable form fields during login', async () => {
    loginMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });
  });

  it('should show error message on login failure', async () => {
    loginMock.mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });

    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Invalid credentials'
      );
    });
  });

  it('should clear error when user starts typing', async () => {
    loginMock.mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });

    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });

    await waitFor(() => {
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  it('should call login service with correct credentials', async () => {
    loginMock.mockResolvedValue({
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

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });
  });

  it('should be accessible with proper ARIA labels', () => {
    renderComponent();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should support keyboard navigation', async () => {
    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    emailInput.focus();
    expect(document.activeElement).toBe(emailInput);

    const user = userEvent.setup();
    await user.tab();
    expect(document.activeElement).toBe(passwordInput);

    await user.tab();
    expect(document.activeElement).toBe(loginButton);
  });
});

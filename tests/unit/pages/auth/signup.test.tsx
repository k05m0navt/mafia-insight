import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SignupPage from '@/app/(auth)/signup/page';
import { AuthProvider } from '@/components/auth/AuthProvider';

const MockedAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('SignupPage', () => {
  it('should render signup page with title and form', () => {
    render(
      <MockedAuthProvider>
        <SignupPage />
      </MockedAuthProvider>
    );

    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByTestId('signup-form')).toBeInTheDocument();
  });

  it('should have proper page structure', () => {
    render(
      <MockedAuthProvider>
        <SignupPage />
      </MockedAuthProvider>
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('signup-container')).toBeInTheDocument();
  });

  it('should be responsive on mobile', () => {
    render(
      <MockedAuthProvider>
        <SignupPage />
      </MockedAuthProvider>
    );

    const container = screen.getByTestId('signup-container');
    expect(container).toHaveClass(
      'min-h-screen',
      'flex',
      'items-center',
      'justify-center'
    );
  });

  it('should have proper heading hierarchy', () => {
    render(
      <MockedAuthProvider>
        <SignupPage />
      </MockedAuthProvider>
    );

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Create your account');
  });

  it('should have link to login page', () => {
    render(
      <MockedAuthProvider>
        <SignupPage />
      </MockedAuthProvider>
    );

    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should have proper meta information', () => {
    render(
      <MockedAuthProvider>
        <SignupPage />
      </MockedAuthProvider>
    );

    // Check for accessibility attributes
    expect(screen.getByRole('main')).toHaveAttribute(
      'aria-label',
      'Signup page'
    );
  });
});

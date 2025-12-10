import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect } from 'vitest';
import { SignInRequired } from '@/components/auth/SignInRequired';

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe('SignInRequired', () => {
  beforeEach(() => {
    mockSearchParams.delete('from');
    mockSearchParams.delete('returnUrl');
  });

  it('should render default title and description', () => {
    render(<SignInRequired />);

    expect(screen.getByText('Sign In Required')).toBeInTheDocument();
    expect(
      screen.getByText('You need to sign in to access this feature.')
    ).toBeInTheDocument();
  });

  it('should render custom title and description', () => {
    render(
      <SignInRequired title="Custom Title" description="Custom description" />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
  });

  it('should display sign in and sign up buttons', () => {
    render(<SignInRequired />);

    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /create account/i })
    ).toBeInTheDocument();
  });

  it('should include return URL in sign in link when from param exists', () => {
    mockSearchParams.set('from', '/dashboard');
    render(<SignInRequired />);

    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '/login?from=%2Fdashboard');
  });

  it('should include return URL in sign up link when from param exists', () => {
    mockSearchParams.set('from', '/profile');
    render(<SignInRequired />);

    const signUpLink = screen.getByRole('link', { name: /create account/i });
    expect(signUpLink).toHaveAttribute('href', '/signup?from=%2Fprofile');
  });

  it('should use returnUrl param if from param is not present', () => {
    mockSearchParams.set('returnUrl', '/settings');
    render(<SignInRequired />);

    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '/login?from=%2Fsettings');
  });

  it('should not include return URL when no params exist', () => {
    render(<SignInRequired />);

    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '/login');

    const signUpLink = screen.getByRole('link', { name: /create account/i });
    expect(signUpLink).toHaveAttribute('href', '/signup');
  });

  it('should display alert message', () => {
    render(<SignInRequired />);

    expect(
      screen.getByText(/this feature requires authentication/i)
    ).toBeInTheDocument();
  });

  it('should display sign up prompt', () => {
    render(<SignInRequired />);

    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up for free/i)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<SignInRequired className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

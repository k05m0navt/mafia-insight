import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock ErrorBoundary component
const ErrorBoundary = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  try {
    return children;
  } catch (_error) {
    return (
      fallback || <div data-testid="error-fallback">Something went wrong</div>
    );
  }
};

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Component error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary Component', () => {
  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should display fallback when error occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should allow custom fallback UI', () => {
    const CustomFallback = () => (
      <div data-testid="custom-fallback">Custom error message</div>
    );
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should log errors to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should reset on prop change', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});

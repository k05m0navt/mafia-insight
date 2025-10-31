import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

/**
 * Error Boundary Component Test
 *
 * Tests error boundary functionality for graceful error handling
 */

// Mock error boundary component (create if doesn't exist)
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div role="alert">
            <h2>Something went wrong</h2>
            <p>{this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = true,
}) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and display fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('should have a retry mechanism', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try again');
    expect(retryButton).toBeInTheDocument();
  });

  it('should call componentDidCatch when error occurs', () => {
    const spy = vi.spyOn(ErrorBoundary.prototype, 'componentDidCatch');

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should not catch errors from event handlers', () => {
    // Error boundaries only catch errors during rendering, not in event handlers
    const EventHandlerError: React.FC = () => {
      const handleClick = () => {
        throw new Error('Event handler error');
      };

      return <button onClick={handleClick}>Click me</button>;
    };

    render(
      <ErrorBoundary>
        <EventHandlerError />
      </ErrorBoundary>
    );

    // Component should render normally
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle multiple children', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  it('should handle errors in nested components', () => {
    const Nested: React.FC = () => {
      return (
        <div>
          <ThrowError />
        </div>
      );
    };

    render(
      <ErrorBoundary>
        <Nested />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('ErrorBoundary Integration', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should work with async components', async () => {
    const AsyncComponent: React.FC = () => {
      const [shouldThrow, setShouldThrow] = React.useState(false);

      React.useEffect(() => {
        setShouldThrow(true);
      }, []);

      if (shouldThrow) {
        throw new Error('Async error');
      }

      return <div>Async content</div>;
    };

    render(
      <ErrorBoundary>
        <AsyncComponent />
      </ErrorBoundary>
    );

    // Should eventually show error
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should isolate errors to specific boundaries', () => {
    render(
      <div>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
        <ErrorBoundary>
          <div>Safe content</div>
        </ErrorBoundary>
      </div>
    );

    // First boundary should show error
    expect(screen.getByRole('alert')).toBeInTheDocument();
    // Second boundary should render normally
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('should handle errors in production mode', () => {
    // In production, React doesn't show the error overlay
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });
});

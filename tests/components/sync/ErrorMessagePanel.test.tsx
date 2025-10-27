import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessagePanel } from '@/components/sync/ErrorMessagePanel';

/**
 * Tests for ErrorMessagePanel component.
 *
 * ErrorMessagePanel displays import errors with actionable guidance.
 * Pattern inspired by react-error-boundary's fallback components:
 * - Clear error message
 * - Error details expansion
 * - Retry action integration
 * - User guidance
 * - Accessibility (role="alert")
 *
 * Follows WCAG 2.2 accessibility guidelines:
 * - Alert role for screen readers
 * - Clear error messaging
 * - Actionable guidance
 * - Keyboard accessible
 */

describe('ErrorMessagePanel', () => {
  describe('Rendering', () => {
    it('should render with error message', () => {
      render(
        <ErrorMessagePanel error="Failed to fetch data from gomafia.pro" />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to fetch data/i)).toBeInTheDocument();
    });

    it('should render with Error object', () => {
      const error = new Error('Network connection failed');
      render(<ErrorMessagePanel error={error} />);

      expect(
        screen.getByText(/network connection failed/i)
      ).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(
        <ErrorMessagePanel error="Something went wrong" title="Import Error" />
      );

      expect(screen.getByText(/import error/i)).toBeInTheDocument();
    });

    it('should use default "Error" title when not provided', () => {
      render(<ErrorMessagePanel error="Something went wrong" />);

      expect(screen.getByText(/^error$/i)).toBeInTheDocument();
    });

    it('should render with icon', () => {
      const MockIcon = () => <svg data-testid="error-icon" />;
      render(<ErrorMessagePanel error="Error occurred" icon={<MockIcon />} />);

      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });
  });

  describe('User Guidance', () => {
    it('should display actionable guidance', () => {
      render(
        <ErrorMessagePanel
          error="Network timeout"
          guidance="Check your internet connection and try again."
        />
      );

      expect(
        screen.getByText(/check your internet connection/i)
      ).toBeInTheDocument();
    });

    it('should not render guidance section when not provided', () => {
      const { container } = render(
        <ErrorMessagePanel error="Error occurred" />
      );

      // Should not have guidance text
      expect(container.textContent).not.toMatch(/try again/i);
    });

    it('should render multiple guidance points as list', () => {
      render(
        <ErrorMessagePanel
          error="Import failed"
          guidance={[
            'Check your internet connection',
            'Verify gomafia.pro is accessible',
            'Try again in a few minutes',
          ]}
        />
      );

      expect(
        screen.getByText(/check your internet connection/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/verify gomafia.pro is accessible/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/try again in a few minutes/i)
      ).toBeInTheDocument();
    });
  });

  describe('Error Details', () => {
    it('should show expandable error details', () => {
      const error = new Error('Detailed error message');
      error.stack = 'Error: Detailed error message\n    at Object.<anonymous>';

      render(<ErrorMessagePanel error={error} showDetails />);

      expect(screen.getByText(/error details/i)).toBeInTheDocument();
    });

    it('should expand details when clicked', async () => {
      const user = userEvent.setup();
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at TestComponent';

      render(<ErrorMessagePanel error={error} showDetails />);

      const detailsButton = screen.getByText(/error details/i);
      await user.click(detailsButton);

      expect(screen.getByText(/at TestComponent/i)).toBeInTheDocument();
    });

    it('should not show details section when showDetails is false', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at TestComponent';

      render(<ErrorMessagePanel error={error} showDetails={false} />);

      expect(screen.queryByText(/error details/i)).not.toBeInTheDocument();
    });

    it('should handle error without stack trace', () => {
      const error = new Error('Simple error');
      delete error.stack;

      render(<ErrorMessagePanel error={error} showDetails />);

      expect(screen.getByText(/simple error/i)).toBeInTheDocument();
    });
  });

  describe('Retry Integration', () => {
    it('should render retry button when onRetry provided', () => {
      const onRetry = vi.fn();

      render(<ErrorMessagePanel error="Import failed" onRetry={onRetry} />);

      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', async () => {
      const onRetry = vi.fn();
      const user = userEvent.setup();

      render(<ErrorMessagePanel error="Import failed" onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not render retry button when onRetry not provided', () => {
      render(<ErrorMessagePanel error="Import failed" />);

      expect(
        screen.queryByRole('button', { name: /retry/i })
      ).not.toBeInTheDocument();
    });

    it('should disable retry button during retry', () => {
      const onRetry = vi.fn();

      render(
        <ErrorMessagePanel
          error="Import failed"
          onRetry={onRetry}
          isRetrying={true}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retrying/i });
      expect(retryButton).toBeDisabled();
    });

    it('should use custom retry text', () => {
      const onRetry = vi.fn();

      render(
        <ErrorMessagePanel
          error="Import failed"
          onRetry={onRetry}
          retryText="Try Again"
        />
      );

      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should use destructive variant by default', () => {
      const { container } = render(
        <ErrorMessagePanel error="Error occurred" />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toContain('destructive');
    });

    it('should support custom variant', () => {
      const { container } = render(
        <ErrorMessagePanel error="Warning" variant="default" />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).not.toContain('destructive');
    });
  });

  describe('Accessibility', () => {
    it('should have alert role for screen readers', () => {
      render(<ErrorMessagePanel error="Error occurred" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have accessible error message', () => {
      render(<ErrorMessagePanel error="Network timeout occurred" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Network timeout occurred');
    });

    it('should support aria-label', () => {
      render(
        <ErrorMessagePanel
          error="Error occurred"
          aria-label="Import error notification"
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-label', 'Import error notification');
    });

    it('should be keyboard accessible', async () => {
      const onRetry = vi.fn();
      const user = userEvent.setup();

      render(<ErrorMessagePanel error="Error" onRetry={onRetry} />);

      await user.tab();
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onRetry).toHaveBeenCalled();
    });

    it('should announce error to screen readers', () => {
      render(<ErrorMessagePanel error="Critical error occurred" />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      // role="alert" automatically announces to screen readers
    });
  });

  describe('Error Code Support', () => {
    it('should display error code when provided', () => {
      render(<ErrorMessagePanel error="Network error" errorCode="EC-006" />);

      expect(screen.getByText(/EC-006/i)).toBeInTheDocument();
    });

    it('should not display error code section when not provided', () => {
      render(<ErrorMessagePanel error="Network error" />);

      expect(screen.queryByText(/EC-/i)).not.toBeInTheDocument();
    });
  });

  describe('Timestamp Support', () => {
    it('should display timestamp when provided', () => {
      const timestamp = new Date('2025-01-26T12:00:00Z');
      render(
        <ErrorMessagePanel error="Error occurred" timestamp={timestamp} />
      );

      expect(screen.getByText(/occurred at/i)).toBeInTheDocument();
    });

    it('should format timestamp correctly', () => {
      const timestamp = new Date('2025-01-26T12:00:00Z');
      render(<ErrorMessagePanel error="Error" timestamp={timestamp} />);

      const timestampText = screen.getByText(/occurred at/i);
      expect(timestampText.textContent).toMatch(/2025/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined error gracefully', () => {
      expect(() => {
        render(<ErrorMessagePanel error={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle null error gracefully', () => {
      expect(() => {
        render(<ErrorMessagePanel error={null as any} />);
      }).not.toThrow();
    });

    it('should handle empty string error', () => {
      render(<ErrorMessagePanel error="" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle very long error messages', () => {
      const longError = 'A'.repeat(1000);
      render(<ErrorMessagePanel error={longError} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle special characters in error message', () => {
      render(
        <ErrorMessagePanel error="Error: <script>alert('xss')</script>" />
      );

      const alert = screen.getByRole('alert');
      // React automatically escapes HTML, preventing XSS
      expect(alert.textContent).toContain('<script>');
    });
  });

  describe('Integration Scenarios', () => {
    it('should display network error with guidance', () => {
      render(
        <ErrorMessagePanel
          error="Failed to connect to gomafia.pro"
          errorCode="EC-006"
          guidance={[
            'Check your internet connection',
            'Verify gomafia.pro is accessible',
            'Try again in a few minutes',
          ]}
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText(/failed to connect/i)).toBeInTheDocument();
      expect(screen.getByText(/EC-006/i)).toBeInTheDocument();
      expect(
        screen.getByText(/check your internet connection/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
    });

    it('should display timeout error with retry', () => {
      render(
        <ErrorMessagePanel
          error="Import operation timed out after 12 hours"
          errorCode="EC-008"
          guidance="The import took longer than expected. You can resume from where it stopped."
          onRetry={vi.fn()}
          retryText="Resume Import"
        />
      );

      expect(screen.getByText(/timed out/i)).toBeInTheDocument();
      expect(screen.getByText(/EC-008/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /resume import/i })
      ).toBeInTheDocument();
    });

    it('should display parser error with details', () => {
      const error = new Error('Failed to parse player data');
      error.stack =
        'Error: Failed to parse player data\n    at parsePlayer (parser.ts:42)';

      render(
        <ErrorMessagePanel
          error={error}
          errorCode="EC-004"
          guidance="The data format from gomafia.pro may have changed. Please report this issue."
          showDetails
        />
      );

      // Error message appears in both main text and details, so check for role="alert"
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Failed to parse player data');
      expect(screen.getByText(/EC-004/i)).toBeInTheDocument();
      expect(screen.getByText(/error details/i)).toBeInTheDocument();
    });
  });
});

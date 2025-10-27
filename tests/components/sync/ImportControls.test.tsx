import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportControls } from '@/components/sync/ImportControls';
import '@testing-library/jest-dom';

/**
 * Tests for ImportControls component with Phase 6 (US3) integration.
 *
 * Integration includes:
 * - CancelButton for graceful cancellation
 * - RetryButton for failed import retry
 * - ErrorMessagePanel for comprehensive error display
 */

describe('ImportControls', () => {
  describe('Basic Rendering', () => {
    it('should render start button when not running and no error', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={false}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Start Import')).toBeInTheDocument();
      expect(screen.queryByText('Cancel Import')).not.toBeInTheDocument();
    });

    it('should render CancelButton when running', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={true}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      expect(
        screen.getByRole('button', { name: /cancel import/i })
      ).toBeInTheDocument();
      expect(screen.queryByText('Start Import')).not.toBeInTheDocument();
    });

    it('should render RetryButton when isRetry is true', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={false}
          isRetry={true}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      expect(
        screen.getByRole('button', { name: /retry import/i })
      ).toBeInTheDocument();
      expect(screen.queryByText('Start Import')).not.toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onTrigger when start button is clicked', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={false}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      fireEvent.click(screen.getByText('Start Import'));
      expect(onTrigger).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when CancelButton is clicked', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={true}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /cancel import/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onTrigger).not.toHaveBeenCalled();
    });

    it('should call onTrigger when RetryButton is clicked', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={false}
          isRetry={true}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /retry import/i }));
      expect(onTrigger).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should disable start button when isPending is true', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={false}
          isPending={true}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show loading text when isPending is true', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={false}
          isPending={true}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Starting...')).toBeInTheDocument();
    });

    it('should disable CancelButton when isPending is true', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={true}
          isPending={true}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      // Button has aria-label, so check by text content
      const button = screen.getByText(/cancelling/i).closest('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Error Display', () => {
    it('should display ErrorMessagePanel when error is provided', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();
      const error = 'Network timeout occurred';

      render(
        <ImportControls
          isRunning={false}
          error={error}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent(error);
      // ErrorMessagePanel includes retry button
      expect(
        screen.getByRole('button', { name: /retry import/i })
      ).toBeInTheDocument();
    });

    it('should display ErrorMessagePanel with error code', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={false}
          error="Network timeout"
          errorCode="EC-006"
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('EC-006')).toBeInTheDocument();
    });

    it('should display ErrorMessagePanel with guidance', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();
      const guidance = ['Check your connection', 'Try again later'];

      render(
        <ImportControls
          isRunning={false}
          error="Network error"
          errorGuidance={guidance}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
      expect(screen.getByText(/try again later/i)).toBeInTheDocument();
    });

    it('should not display error message when error is null', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={false}
          error={null}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should hide control buttons when error is displayed', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={false}
          error="Some error"
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      // Error panel has its own retry button, main control buttons are hidden
      expect(screen.queryByText('Start Import')).not.toBeInTheDocument();
    });
  });

  describe('Success Messages', () => {
    it('should show success message when provided', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();
      const successMessage = 'Import started successfully!';

      render(
        <ImportControls
          isRunning={true}
          successMessage={successMessage}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText(successMessage)).toBeInTheDocument();
    });

    it('should not show success message when error is present', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={false}
          error="Some error"
          successMessage="Success!"
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      // Error takes precedence
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible cancel button with aria-label', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={true}
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      const button = screen.getByRole('button', {
        name: /cancel import and save checkpoint/i,
      });
      expect(button).toBeInTheDocument();
    });

    it('should announce errors to screen readers', () => {
      const onTrigger = vi.fn();
      const onCancel = vi.fn();

      render(
        <ImportControls
          isRunning={false}
          error="Network error"
          onTrigger={onTrigger}
          onCancel={onCancel}
        />
      );

      // ErrorMessagePanel has role="alert" for screen readers
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

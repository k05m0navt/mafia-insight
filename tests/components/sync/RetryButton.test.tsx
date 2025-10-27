import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RetryButton } from '@/components/sync/RetryButton';

/**
 * Tests for RetryButton component.
 *
 * RetryButton is used when import fails, allowing users to retry the operation.
 * Follows WCAG 2.2 accessibility guidelines:
 * - Semantic button element
 * - Clear action label
 * - Disabled state with visual feedback
 * - Keyboard accessible
 * - Screen reader friendly
 */

describe('RetryButton', () => {
  describe('Rendering', () => {
    it('should render with default "Retry Import" text', () => {
      render(<RetryButton onClick={vi.fn()} />);

      expect(
        screen.getByRole('button', { name: /retry import/i })
      ).toBeInTheDocument();
    });

    it('should render with custom text', () => {
      render(
        <RetryButton onClick={vi.fn()}>Retry Failed Operation</RetryButton>
      );

      expect(
        screen.getByRole('button', { name: /retry failed operation/i })
      ).toBeInTheDocument();
    });

    it('should use outline variant by default', () => {
      render(<RetryButton onClick={vi.fn()} />);

      const button = screen.getByRole('button');
      // Check for outline variant classes
      expect(button.className).toContain('border');
    });

    it('should render with icon when provided', () => {
      const MockIcon = () => <svg data-testid="retry-icon" />;
      render(<RetryButton onClick={vi.fn()} icon={<MockIcon />} />);

      expect(screen.getByTestId('retry-icon')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<RetryButton onClick={vi.fn()} disabled />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show loading text when disabled', () => {
      render(<RetryButton onClick={vi.fn()} disabled />);

      expect(
        screen.getByRole('button', { name: /retrying/i })
      ).toBeInTheDocument();
    });

    it('should show custom loading text when provided', () => {
      render(
        <RetryButton
          onClick={vi.fn()}
          disabled
          loadingText="Starting retry..."
        />
      );

      expect(
        screen.getByRole('button', { name: /starting retry/i })
      ).toBeInTheDocument();
    });

    it('should not call onClick when disabled', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<RetryButton onClick={onClick} disabled />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should have pointer-events-none when disabled', () => {
      render(<RetryButton onClick={vi.fn()} disabled />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:pointer-events-none');
    });

    it('should have reduced opacity when disabled', () => {
      render(<RetryButton onClick={vi.fn()} disabled />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:opacity-50');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<RetryButton onClick={onClick} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<RetryButton onClick={onClick} />);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('should have visible focus indicator', async () => {
      const user = userEvent.setup();
      render(<RetryButton onClick={vi.fn()} />);

      const button = screen.getByRole('button');
      await user.tab();

      expect(button).toHaveFocus();
      expect(button.className).toContain('focus-visible:ring');
    });

    it('should not trigger multiple times on rapid clicks when disabled', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      const { rerender } = render(<RetryButton onClick={onClick} />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Simulate button becoming disabled after first click
      rerender(<RetryButton onClick={onClick} disabled />);

      await user.click(button);
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<RetryButton onClick={vi.fn()} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have aria-label when provided', () => {
      render(
        <RetryButton onClick={vi.fn()} aria-label="Retry failed import" />
      );

      expect(
        screen.getByRole('button', { name: 'Retry failed import' })
      ).toBeInTheDocument();
    });

    it('should be announced to screen readers', () => {
      render(<RetryButton onClick={vi.fn()} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName();
    });

    it('should indicate disabled state to assistive tech', () => {
      render(<RetryButton onClick={vi.fn()} disabled />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('should support custom aria attributes', () => {
      render(
        <RetryButton
          onClick={vi.fn()}
          aria-describedby="error-message"
          aria-label="Retry import after network error"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'error-message');
      expect(button).toHaveAttribute(
        'aria-label',
        'Retry import after network error'
      );
    });
  });

  describe('Variants', () => {
    it('should support default variant', () => {
      render(<RetryButton onClick={vi.fn()} variant="default" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-primary');
    });

    it('should support outline variant', () => {
      render(<RetryButton onClick={vi.fn()} variant="outline" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('border');
    });

    it('should support secondary variant', () => {
      render(<RetryButton onClick={vi.fn()} variant="secondary" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-secondary');
    });
  });

  describe('Sizes', () => {
    it('should support default size', () => {
      render(<RetryButton onClick={vi.fn()} size="default" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('h-9');
    });

    it('should support sm size', () => {
      render(<RetryButton onClick={vi.fn()} size="sm" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
    });

    it('should support lg size', () => {
      render(<RetryButton onClick={vi.fn()} size="lg" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onClick gracefully', () => {
      // TypeScript would prevent this, but JavaScript allows it
      expect(() => {
        render(<RetryButton onClick={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle className prop', () => {
      render(<RetryButton onClick={vi.fn()} className="custom-class" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });

    it('should forward additional button props', () => {
      render(
        <RetryButton onClick={vi.fn()} data-testid="retry-btn" title="Retry" />
      );

      const button = screen.getByTestId('retry-btn');
      expect(button).toHaveAttribute('title', 'Retry');
    });
  });

  describe('Integration with Error Recovery', () => {
    it('should be usable after failed import', () => {
      const onRetry = vi.fn();

      const { rerender } = render(
        <div>
          <div role="alert">Import failed</div>
          <RetryButton onClick={onRetry} />
        </div>
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Import failed');
      expect(
        screen.getByRole('button', { name: /retry import/i })
      ).toBeInTheDocument();
    });

    it('should show loading state during retry', () => {
      const { rerender } = render(<RetryButton onClick={vi.fn()} />);

      expect(
        screen.getByRole('button', { name: /retry import/i })
      ).toBeInTheDocument();

      rerender(<RetryButton onClick={vi.fn()} disabled />);

      expect(
        screen.getByRole('button', { name: /retrying/i })
      ).toBeInTheDocument();
    });
  });
});

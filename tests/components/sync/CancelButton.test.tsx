import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CancelButton } from '@/components/sync/CancelButton';

/**
 * Tests for CancelButton component.
 *
 * CancelButton is used to cancel a running import operation.
 * Follows WCAG 2.2 accessibility guidelines:
 * - Destructive variant for clear visual warning
 * - Semantic button element
 * - Clear action label
 * - Disabled state with visual feedback
 * - Keyboard accessible
 * - Screen reader friendly
 */

describe('CancelButton', () => {
  describe('Rendering', () => {
    it('should render with default "Cancel Import" text', () => {
      render(<CancelButton onClick={vi.fn()} />);

      expect(
        screen.getByRole('button', { name: /cancel import/i })
      ).toBeInTheDocument();
    });

    it('should render with custom text', () => {
      render(<CancelButton onClick={vi.fn()}>Stop Operation</CancelButton>);

      expect(
        screen.getByRole('button', { name: /stop operation/i })
      ).toBeInTheDocument();
    });

    it('should use destructive variant by default', () => {
      render(<CancelButton onClick={vi.fn()} />);

      const button = screen.getByRole('button');
      // Check for destructive variant classes
      expect(button.className).toContain('bg-destructive');
    });

    it('should render with icon when provided', () => {
      const MockIcon = () => <svg data-testid="cancel-icon" />;
      render(<CancelButton onClick={vi.fn()} icon={<MockIcon />} />);

      expect(screen.getByTestId('cancel-icon')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<CancelButton onClick={vi.fn()} disabled />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show loading text when disabled', () => {
      render(<CancelButton onClick={vi.fn()} disabled />);

      expect(
        screen.getByRole('button', { name: /cancelling/i })
      ).toBeInTheDocument();
    });

    it('should show custom loading text when provided', () => {
      render(
        <CancelButton onClick={vi.fn()} disabled loadingText="Stopping..." />
      );

      expect(
        screen.getByRole('button', { name: /stopping/i })
      ).toBeInTheDocument();
    });

    it('should not call onClick when disabled', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<CancelButton onClick={onClick} disabled />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should have pointer-events-none when disabled', () => {
      render(<CancelButton onClick={vi.fn()} disabled />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:pointer-events-none');
    });

    it('should have reduced opacity when disabled', () => {
      render(<CancelButton onClick={vi.fn()} disabled />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:opacity-50');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<CancelButton onClick={onClick} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<CancelButton onClick={onClick} />);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('should have visible focus indicator', async () => {
      const user = userEvent.setup();
      render(<CancelButton onClick={vi.fn()} />);

      const button = screen.getByRole('button');
      await user.tab();

      expect(button).toHaveFocus();
      expect(button.className).toContain('focus-visible:ring');
    });

    it('should not trigger multiple times on rapid clicks when disabled', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      const { rerender } = render(<CancelButton onClick={onClick} />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Simulate button becoming disabled after first click
      rerender(<CancelButton onClick={onClick} disabled />);

      await user.click(button);
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<CancelButton onClick={vi.fn()} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have aria-label when provided', () => {
      render(
        <CancelButton onClick={vi.fn()} aria-label="Cancel running import" />
      );

      expect(
        screen.getByRole('button', { name: 'Cancel running import' })
      ).toBeInTheDocument();
    });

    it('should be announced to screen readers', () => {
      render(<CancelButton onClick={vi.fn()} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName();
    });

    it('should indicate disabled state to assistive tech', () => {
      render(<CancelButton onClick={vi.fn()} disabled />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('should support custom aria attributes', () => {
      render(
        <CancelButton
          onClick={vi.fn()}
          aria-describedby="warning-message"
          aria-label="Cancel import and save progress"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'warning-message');
      expect(button).toHaveAttribute(
        'aria-label',
        'Cancel import and save progress'
      );
    });

    it('should use destructive variant for visual warning', () => {
      render(<CancelButton onClick={vi.fn()} />);

      const button = screen.getByRole('button');
      // Destructive variant provides clear visual warning for potentially destructive action
      expect(button.className).toContain('bg-destructive');
      expect(button.className).toContain('text-destructive-foreground');
    });
  });

  describe('Variants', () => {
    it('should support destructive variant (default)', () => {
      render(<CancelButton onClick={vi.fn()} variant="destructive" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-destructive');
    });

    it('should support outline variant', () => {
      render(<CancelButton onClick={vi.fn()} variant="outline" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('border');
    });

    it('should support ghost variant', () => {
      render(<CancelButton onClick={vi.fn()} variant="ghost" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:bg-accent');
    });
  });

  describe('Sizes', () => {
    it('should support default size', () => {
      render(<CancelButton onClick={vi.fn()} size="default" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('h-9');
    });

    it('should support sm size', () => {
      render(<CancelButton onClick={vi.fn()} size="sm" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
    });

    it('should support lg size', () => {
      render(<CancelButton onClick={vi.fn()} size="lg" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onClick gracefully', () => {
      // TypeScript would prevent this, but JavaScript allows it
      expect(() => {
        render(<CancelButton onClick={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle className prop', () => {
      render(<CancelButton onClick={vi.fn()} className="custom-class" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });

    it('should forward additional button props', () => {
      render(
        <CancelButton
          onClick={vi.fn()}
          data-testid="cancel-btn"
          title="Cancel"
        />
      );

      const button = screen.getByTestId('cancel-btn');
      expect(button).toHaveAttribute('title', 'Cancel');
    });
  });

  describe('Integration with Import Cancellation', () => {
    it('should be usable during running import', () => {
      const onCancel = vi.fn();

      render(
        <div>
          <div role="status">Import in progress...</div>
          <CancelButton onClick={onCancel} />
        </div>
      );

      expect(screen.getByRole('status')).toHaveTextContent(
        'Import in progress'
      );
      expect(
        screen.getByRole('button', { name: /cancel import/i })
      ).toBeInTheDocument();
    });

    it('should show loading state during cancellation', () => {
      const { rerender } = render(<CancelButton onClick={vi.fn()} />);

      expect(
        screen.getByRole('button', { name: /cancel import/i })
      ).toBeInTheDocument();

      rerender(<CancelButton onClick={vi.fn()} disabled />);

      expect(
        screen.getByRole('button', { name: /cancelling/i })
      ).toBeInTheDocument();
    });

    it('should indicate that cancellation saves checkpoint', () => {
      render(
        <div>
          <CancelButton
            onClick={vi.fn()}
            aria-label="Cancel import and save checkpoint for resume"
          />
          <div id="cancel-info">Cancellation will save your progress</div>
        </div>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Cancel import and save checkpoint for resume'
      );
      expect(screen.getByText(/save your progress/i)).toBeInTheDocument();
    });
  });

  describe('Confirmation Pattern (Future Enhancement)', () => {
    it('should be compatible with confirmation dialog', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();

      // In real usage, this would trigger a confirmation dialog
      render(<CancelButton onClick={onCancel} data-confirm="true" />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Button handler is called, where confirmation logic would be implemented
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});

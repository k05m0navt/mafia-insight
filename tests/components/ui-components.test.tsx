import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

/**
 * Test suite for ShadCN/UI components with custom theme
 * Verifies components render correctly and are accessible
 */
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('ShadCN/UI Components with Custom Theme', () => {
  describe('Button Component', () => {
    it('should render button with primary variant', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should render button with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button', { name: /secondary/i });
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('should render button with accent variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button', { name: /outline/i });
      expect(button).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await user.tab();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have focus-visible ring for accessibility', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'focus-visible:ring-1',
        'focus-visible:ring-ring'
      );
    });
  });

  describe('Card Component', () => {
    it('should render card with custom theme colors', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card content</CardContent>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should use theme color tokens', () => {
      const { container } = renderWithTheme(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      );

      const card = container.querySelector('.bg-card');
      expect(card).toHaveClass('bg-card', 'text-card-foreground');
    });
  });

  describe('Input Component', () => {
    it('should render input with theme colors', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
      expect(input.className).toContain('border-input');
      expect(input.className).toContain('text-foreground');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);

      const input = screen.getByPlaceholderText('Type here');
      await user.tab();
      expect(input).toHaveFocus();

      await user.type(input, 'test');
      expect(input).toHaveValue('test');
    });

    it('should have focus-visible ring for accessibility', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'focus-visible:ring-1',
        'focus-visible:ring-ring'
      );
    });

    it('should show disabled state correctly', () => {
      render(<Input disabled placeholder="Disabled" />);
      const input = screen.getByPlaceholderText('Disabled');
      expect(input).toBeDisabled();
      expect(input).toHaveClass(
        'disabled:opacity-50',
        'disabled:cursor-not-allowed'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes where needed', () => {
      render(<Button aria-label="Submit form">Submit</Button>);
      const button = screen.getByRole('button', { name: /submit form/i });
      expect(button).toHaveAttribute('aria-label', 'Submit form');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>First</Button>
          <Button>Second</Button>
          <Input placeholder="Input" />
        </div>
      );

      await user.tab();
      expect(screen.getByRole('button', { name: /first/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /second/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByPlaceholderText('Input')).toHaveFocus();
    });
  });
});

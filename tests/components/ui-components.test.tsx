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

    describe('Card Variants', () => {
      it('should render default variant correctly', () => {
        const { container } = render(<Card variant="default">Content</Card>);
        const card = container.querySelector('.rounded-xl');
        expect(card).toBeInTheDocument();
        expect(card).toHaveClass('shadow-[0_1px_3px_rgba(0,0,0,0.1)]');
      });

      it('should render elevated variant with hover effect', () => {
        const { container } = render(<Card variant="elevated">Content</Card>);
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass('hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]');
      });

      it('should render outlined variant without shadow', () => {
        const { container } = render(<Card variant="outlined">Content</Card>);
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass('border-2', 'shadow-none');
      });

      it('should render ghost variant with transparent background', () => {
        const { container } = render(<Card variant="ghost">Content</Card>);
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass(
          'bg-transparent',
          'border-transparent',
          'shadow-none'
        );
      });

      it('should render interactive variant with cursor pointer', () => {
        const { container } = render(
          <Card variant="interactive">Content</Card>
        );
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass('cursor-pointer', 'hover:border-primary/50');
      });

      it('should render metric variant with 8px radius and 20px padding', () => {
        const { container } = render(<Card variant="metric">Content</Card>);
        const card = container.querySelector('.rounded-lg');
        expect(card).toBeInTheDocument();
        expect(card).toHaveClass('shadow-[0_1px_2px_rgba(0,0,0,0.05)]', 'p-5');
      });

      it('should render chart variant correctly', () => {
        const { container } = render(<Card variant="chart">Content</Card>);
        const card = container.querySelector('.rounded-xl');
        expect(card).toBeInTheDocument();
        expect(card).toHaveClass('shadow-sm');
      });

      it('should render info variant correctly', () => {
        const { container } = render(<Card variant="info">Content</Card>);
        const card = container.querySelector('.rounded-xl');
        expect(card).toBeInTheDocument();
        expect(card).toHaveClass('shadow-sm');
      });

      it('should render role variant with don roleType', () => {
        const { container } = render(
          <Card variant="role" roleType="don">
            Content
          </Card>
        );
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass(
          'border-2',
          'bg-purple-50',
          'border-purple-600'
        );
      });

      it('should render role variant with mafia roleType', () => {
        const { container } = render(
          <Card variant="role" roleType="mafia">
            Content
          </Card>
        );
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass('border-2', 'bg-gray-100', 'border-black');
      });

      it('should render role variant with sheriff roleType', () => {
        const { container } = render(
          <Card variant="role" roleType="sheriff">
            Content
          </Card>
        );
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass(
          'border-2',
          'bg-yellow-50',
          'border-yellow-400'
        );
      });

      it('should render role variant with citizen roleType', () => {
        const { container } = render(
          <Card variant="role" roleType="citizen">
            Content
          </Card>
        );
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass('border-2', 'bg-red-50', 'border-red-500');
      });
    });

    describe('Card Padding Variants', () => {
      it('should apply padding-none correctly', () => {
        const { container } = render(<Card padding="none">Content</Card>);
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass('p-0');
      });

      it('should apply padding-sm correctly', () => {
        const { container } = render(<Card padding="sm">Content</Card>);
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass('p-4');
      });

      it('should apply padding-default correctly', () => {
        const { container } = render(<Card padding="default">Content</Card>);
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass('p-6');
      });

      it('should apply padding-lg correctly', () => {
        const { container } = render(<Card padding="lg">Content</Card>);
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass('p-8');
      });

      it('should override metric variant padding with custom padding', () => {
        const { container } = render(
          <Card variant="metric" padding="sm">
            Content
          </Card>
        );
        const card = container.querySelector('.rounded-lg');
        expect(card).toHaveClass('p-4'); // Should use sm padding, not default metric padding
      });
    });

    describe('Backward Compatibility', () => {
      it('should maintain default variant behavior', () => {
        const { container } = render(<Card>Content</Card>);
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass('shadow-[0_1px_3px_rgba(0,0,0,0.1)]', 'p-6');
      });

      it('should work with existing variant and padding combinations', () => {
        const { container } = render(
          <Card variant="elevated" padding="lg">
            Content
          </Card>
        );
        const card = container.querySelector('.rounded-xl');
        expect(card).toHaveClass('p-8');
      });
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

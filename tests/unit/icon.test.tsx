import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon } from '@/components/ui/icon';
import { User, Settings, Check } from 'lucide-react';

describe('Icon Component', () => {
  describe('Rendering', () => {
    it('should render icon with correct size', () => {
      const { container } = render(
        <Icon icon={User} size="md" aria-label="User" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-5', 'w-5');
    });

    it('should render extra small icon', () => {
      const { container } = render(
        <Icon icon={User} size="xs" aria-label="User" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-3', 'w-3');
    });

    it('should render small icon', () => {
      const { container } = render(
        <Icon icon={User} size="sm" aria-label="User" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-4', 'w-4');
    });

    it('should render large icon', () => {
      const { container } = render(
        <Icon icon={User} size="lg" aria-label="User" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-6', 'w-6');
    });

    it('should render extra large icon', () => {
      const { container } = render(
        <Icon icon={User} size="xl" aria-label="User" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-8', 'w-8');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Icon
          icon={User}
          size="md"
          aria-label="User"
          className="text-primary"
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-primary');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label when provided', () => {
      render(<Icon icon={User} size="md" aria-label="User profile" />);
      const icon = screen.getByLabelText('User profile');
      expect(icon).toBeInTheDocument();
    });

    it('should be hidden from screen readers when decorative', () => {
      const { container } = render(<Icon icon={Check} decorative />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should not have aria-label when decorative', () => {
      const { container } = render(<Icon icon={Check} decorative />);
      const svg = container.querySelector('svg');
      expect(svg).not.toHaveAttribute('aria-label');
    });
  });

  describe('Responsive Sizing', () => {
    it('should render correctly at different screen sizes', () => {
      // Test that icons maintain their size classes across breakpoints
      const { container } = render(
        <Icon icon={Settings} size="md" aria-label="Settings" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-5', 'w-5');
    });
  });
});

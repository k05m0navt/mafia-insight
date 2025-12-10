import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { Card } from '@/components/ui/card';

describe('Responsive Layout Components', () => {
  describe('ResponsiveGrid', () => {
    it('should render with default responsive classes', () => {
      const { container } = render(
        <ResponsiveGrid>
          <Card>Item 1</Card>
          <Card>Item 2</Card>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-1'); // Mobile default
      expect(grid).toHaveClass('sm:grid-cols-2'); // Tablet default
      expect(grid).toHaveClass('md:grid-cols-3'); // Desktop default
      expect(grid).toHaveClass('lg:grid-cols-4'); // Large default
    });

    it('should apply custom column counts', () => {
      const { container } = render(
        <ResponsiveGrid
          colsMobile={2}
          colsTablet={3}
          colsDesktop={4}
          colsLarge={6}
        >
          <Card>Item</Card>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid-cols-2'); // Mobile
      expect(grid).toHaveClass('sm:grid-cols-3'); // Tablet
      expect(grid).toHaveClass('md:grid-cols-4'); // Desktop
      expect(grid).toHaveClass('lg:grid-cols-6'); // Large
    });

    it('should apply custom gap', () => {
      const { container } = render(
        <ResponsiveGrid gap="lg">
          <Card>Item</Card>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('gap-6'); // lg gap
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ResponsiveGrid className="custom-class">
          <Card>Item</Card>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('custom-class');
    });
  });

  describe('Responsive Breakpoints', () => {
    it('should use mobile-first approach', () => {
      // Mobile-first means base styles are for mobile, then enhanced for larger screens
      const { container } = render(
        <ResponsiveGrid>
          <Card>Item</Card>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      // Base (mobile) classes should be present
      expect(grid).toHaveClass('grid-cols-1');
      // Responsive classes should enhance, not replace
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('md:grid-cols-3');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });
  });
});

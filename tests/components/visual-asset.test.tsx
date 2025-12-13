import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisualAsset } from '@/components/ui/visual-asset';
import {
  AnalyticsHeroIllustration,
  AnalyticsEmptyStateIllustration,
  PerformanceMetricsIllustration,
} from '@/components/ui/analytics-illustrations';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
    priority,
    className,
    'aria-hidden': ariaHidden,
  }: any) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      data-priority={priority}
      className={className}
      aria-hidden={ariaHidden}
    />
  ),
}));

describe('VisualAsset', () => {
  describe('Image rendering', () => {
    it('renders image with src prop', () => {
      render(
        <VisualAsset
          src="/test-image.svg"
          alt="Test image"
          width={800}
          height={400}
        />
      );

      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/test-image.svg');
      expect(img).toHaveAttribute('width', '800');
      expect(img).toHaveAttribute('height', '400');
    });

    it('applies variant classes correctly', () => {
      const { container } = render(
        <VisualAsset
          variant="hero"
          src="/hero.svg"
          alt="Hero"
          width={800}
          height={400}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('max-w-4xl');
    });

    it('sets priority attribute for above-the-fold images', () => {
      render(
        <VisualAsset
          src="/hero.svg"
          alt="Hero"
          width={800}
          height={400}
          priority
        />
      );

      const img = screen.getByAltText('Hero');
      expect(img).toHaveAttribute('data-priority', 'true');
    });

    it('marks decorative images as aria-hidden', () => {
      const { container } = render(
        <VisualAsset
          src="/decorative.svg"
          alt=""
          width={400}
          height={300}
          decorative
        />
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('aria-hidden', 'true');
    });

    it('warns when alt text is missing for non-decorative images', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<VisualAsset src="/no-alt.svg" width={400} height={300} />);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('alt text is required')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('SVG illustration rendering', () => {
    it('renders children as SVG illustration', () => {
      const { container } = render(
        <VisualAsset variant="illustration">
          <AnalyticsHeroIllustration />
        </VisualAsset>
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('applies variant classes to illustration container', () => {
      const { container } = render(
        <VisualAsset variant="empty-state">
          <AnalyticsEmptyStateIllustration />
        </VisualAsset>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('max-w-md');
    });

    it('marks decorative illustrations as aria-hidden', () => {
      const { container } = render(
        <VisualAsset variant="decorative" decorative>
          <PerformanceMetricsIllustration />
        </VisualAsset>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Accessibility', () => {
    it('provides alt text for images', () => {
      render(
        <VisualAsset
          src="/accessible.svg"
          alt="Descriptive alt text"
          width={400}
          height={300}
        />
      );

      const img = screen.getByAltText('Descriptive alt text');
      expect(img).toBeInTheDocument();
    });

    it('hides decorative assets from screen readers', () => {
      const { container } = render(
        <VisualAsset variant="decorative" decorative>
          <AnalyticsHeroIllustration />
        </VisualAsset>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Responsive behavior', () => {
    it('applies responsive classes for hero variant', () => {
      const { container } = render(
        <VisualAsset
          variant="hero"
          src="/hero.svg"
          alt="Hero"
          width={800}
          height={400}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('w-full', 'h-auto', 'max-w-4xl', 'mx-auto');
    });

    it('applies responsive classes for empty-state variant', () => {
      const { container } = render(
        <VisualAsset variant="empty-state">
          <AnalyticsEmptyStateIllustration />
        </VisualAsset>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('w-full', 'h-auto', 'max-w-md', 'mx-auto');
    });
  });
});

describe('Analytics Illustrations', () => {
  describe('AnalyticsHeroIllustration', () => {
    it('renders hero illustration with correct dimensions', () => {
      const { container } = render(
        <AnalyticsHeroIllustration width={800} height={400} />
      );
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '800');
      expect(svg).toHaveAttribute('height', '400');
      expect(svg).toHaveAttribute('viewBox', '0 0 800 400');
    });

    it('is marked as decorative for screen readers', () => {
      const { container } = render(<AnalyticsHeroIllustration />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('AnalyticsEmptyStateIllustration', () => {
    it('renders empty state illustration', () => {
      const { container } = render(<AnalyticsEmptyStateIllustration />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 400 300');
    });
  });

  describe('PerformanceMetricsIllustration', () => {
    it('renders performance metrics illustration', () => {
      const { container } = render(<PerformanceMetricsIllustration />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 500 300');
    });
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { animations, transitionPresets } from '@/lib/animations';
import { PageTransition } from '@/components/layout/PageTransition';

// Mock matchMedia
const mockMatchMedia = (prefersReducedMotion: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return {
          matches: prefersReducedMotion,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      }
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
};

describe('Prefers Reduced Motion', () => {
  beforeEach(() => {
    mockMatchMedia(false); // Default: motion allowed
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Animation Classes', () => {
    it('should include motion-safe prefix for animations', () => {
      // All animation classes should use motion-safe prefix
      // This ensures they respect prefers-reduced-motion
      expect(animations.fadeIn).toContain('motion-safe:');
      expect(animations.scaleIn).toContain('motion-safe:');
      expect(animations.spin).toContain('motion-safe:');
    });

    it('should provide transitions that work with reduced motion', () => {
      // Transitions should be fast enough to not cause issues
      expect(transitionPresets.button).toContain('duration-200');
      expect(transitionPresets.input).toContain('duration-150');
    });
  });

  describe('Page Transition', () => {
    it('should render children', () => {
      render(
        <PageTransition>
          <div>Test Content</div>
        </PageTransition>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply fade in animation', () => {
      const { container } = render(
        <PageTransition>
          <div>Content</div>
        </PageTransition>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('motion-safe:animate-in');
      expect(wrapper.className).toContain('motion-safe:fade-in');
    });
  });
});

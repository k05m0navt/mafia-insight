import { describe, it, expect } from 'vitest';
import tailwindConfig from '../../tailwind.config.mjs';

/**
 * Test suite for Tailwind CSS configuration
 * Verifies custom theme, color tokens, and responsive breakpoints
 */
describe('Tailwind CSS Configuration', () => {
  describe('Config Structure', () => {
    it('should export a valid Tailwind config object', () => {
      expect(tailwindConfig).toBeDefined();
      expect(tailwindConfig).toHaveProperty('theme');
      expect(tailwindConfig).toHaveProperty('content');
      expect(tailwindConfig).toHaveProperty('darkMode');
    });

    it('should have responsive breakpoints configured', () => {
      const screens = tailwindConfig.theme?.screens;
      expect(screens).toBeDefined();
      expect(screens?.xs).toBe('320px');
      expect(screens?.sm).toBe('768px');
      expect(screens?.md).toBe('1024px');
      expect(screens?.lg).toBe('1440px');
    });
  });

  describe('Color Tokens', () => {
    it('should have primary color token configured', () => {
      const colors = tailwindConfig.theme?.extend?.colors;
      expect(colors?.primary).toBeDefined();
      expect(colors?.primary?.DEFAULT).toBe('hsl(var(--primary))');
      expect(colors?.primary?.foreground).toBe(
        'hsl(var(--primary-foreground))'
      );
    });

    it('should have secondary color token configured', () => {
      const colors = tailwindConfig.theme?.extend?.colors;
      expect(colors?.secondary).toBeDefined();
      expect(colors?.secondary?.DEFAULT).toBe('hsl(var(--secondary))');
    });

    it('should have accent color token configured', () => {
      const colors = tailwindConfig.theme?.extend?.colors;
      expect(colors?.accent).toBeDefined();
      expect(colors?.accent?.DEFAULT).toBe('hsl(var(--accent))');
    });

    it('should have semantic color tokens configured', () => {
      const colors = tailwindConfig.theme?.extend?.colors;
      expect(colors?.success).toBeDefined();
      expect(colors?.warning).toBeDefined();
      expect(colors?.info).toBeDefined();
      expect(colors?.destructive).toBeDefined();
    });
  });

  describe('Border Radius', () => {
    it('should have border radius tokens configured', () => {
      const borderRadius = tailwindConfig.theme?.extend?.borderRadius;
      expect(borderRadius?.lg).toBe('var(--radius)');
      expect(borderRadius?.md).toBe('calc(var(--radius) - 2px)');
      expect(borderRadius?.sm).toBe('calc(var(--radius) - 4px)');
    });
  });

  describe('Animations', () => {
    it('should have accordion animations configured', () => {
      const animations = tailwindConfig.theme?.extend?.animation;
      expect(animations?.['accordion-down']).toBeDefined();
      expect(animations?.['accordion-up']).toBeDefined();
    });
  });
});

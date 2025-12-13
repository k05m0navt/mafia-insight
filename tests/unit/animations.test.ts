import { describe, it, expect } from 'vitest';
import {
  transitions,
  transitionPresets,
  animations,
  hoverEffects,
  transitionClass,
  animationClass,
} from '@/lib/animations';

describe('Animation Utilities', () => {
  describe('Transitions', () => {
    it('should provide fast transition class', () => {
      expect(transitions.fast).toContain('duration-150');
      expect(transitions.fast).toContain('transition-all');
    });

    it('should provide default transition class', () => {
      expect(transitions.default).toContain('duration-200');
      expect(transitions.default).toContain('transition-all');
    });

    it('should provide slow transition class', () => {
      expect(transitions.slow).toContain('duration-300');
    });
  });

  describe('Transition Presets', () => {
    it('should provide button transition preset', () => {
      expect(transitionPresets.button).toContain('transition-colors');
      expect(transitionPresets.button).toContain('duration-200');
    });

    it('should provide card transition preset', () => {
      expect(transitionPresets.card).toContain('transition-all');
    });

    it('should provide modal transition preset', () => {
      expect(transitionPresets.modal).toContain('duration-300');
    });

    it('should provide fade in animation', () => {
      expect(transitionPresets.fadeIn).toContain('fade-in');
    });

    it('should provide slide animations', () => {
      expect(transitionPresets.slideInTop).toContain('slide-in-from-top');
      expect(transitionPresets.slideInBottom).toContain('slide-in-from-bottom');
      expect(transitionPresets.slideInLeft).toContain('slide-in-from-left');
      expect(transitionPresets.slideInRight).toContain('slide-in-from-right');
    });
  });

  describe('Animations', () => {
    it('should provide motion-safe animations', () => {
      expect(animations.fadeIn).toContain('motion-safe:');
      expect(animations.scaleIn).toContain('motion-safe:');
    });

    it('should provide fade animations', () => {
      expect(animations.fadeIn).toContain('fade-in');
      expect(animations.fadeOut).toContain('fade-out');
    });

    it('should provide scale animations', () => {
      expect(animations.scaleIn).toContain('zoom-in');
      expect(animations.scaleOut).toContain('zoom-out');
    });

    it('should provide spin animation', () => {
      expect(animations.spin).toContain('animate-spin');
    });
  });

  describe('Hover Effects', () => {
    it('should provide lift hover effect', () => {
      expect(hoverEffects.lift).toContain('hover:shadow-lg');
    });

    it('should provide scale hover effect', () => {
      expect(hoverEffects.scale).toContain('hover:scale-105');
    });

    it('should provide brighten hover effect', () => {
      expect(hoverEffects.brighten).toContain('hover:brightness-110');
    });
  });

  describe('Helper Functions', () => {
    it('should combine transition preset with custom classes', () => {
      const result = transitionClass('button', 'custom-class');
      expect(result).toContain('transition-colors');
      expect(result).toContain('custom-class');
    });

    it('should combine animation with custom classes', () => {
      const result = animationClass('fadeIn', 'custom-class');
      expect(result).toContain('motion-safe:animate-in');
      expect(result).toContain('custom-class');
    });
  });
});

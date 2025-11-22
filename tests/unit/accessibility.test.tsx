/**
 * Accessibility Tests
 *
 * Tests for WCAG 2.1 AA compliance, keyboard navigation,
 * and screen reader support.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { accessibilityManager } from '@/lib/accessibility';

describe('accessibilityManager', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('announce', () => {
    it('renders polite announcements for screen readers', () => {
      accessibilityManager.announce('Hello world');

      const node = document.querySelector('[aria-live="polite"]');
      expect(node).toBeInTheDocument();
      expect(node).toHaveTextContent('Hello world');
    });

    it('supports assertive priority', () => {
      accessibilityManager.announce('Failure', 'assertive');

      const node = document.querySelector('[aria-live="assertive"]');
      expect(node).toBeInTheDocument();
      expect(node).toHaveTextContent('Failure');
    });
  });

  describe('focusElement', () => {
    it('focuses the requested element and scrolls it into view', () => {
      const button = document.createElement('button');
      button.textContent = 'Focus me';
      button.scrollIntoView = vi.fn();
      document.body.appendChild(button);

      accessibilityManager.focusElement(button);

      expect(document.activeElement).toBe(button);
      expect(button.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    });

    it('handles null elements safely', () => {
      expect(() => accessibilityManager.focusElement(null)).not.toThrow();
    });
  });

  describe('validateElement', () => {
    it('accepts interactive elements with accessible names', () => {
      const button = document.createElement('button');
      button.textContent = 'Submit';

      const result = accessibilityManager.validateElement(button);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('flags missing accessible names', () => {
      const button = document.createElement('button');
      const result = accessibilityManager.validateElement(button);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(
        'Interactive element missing accessible name'
      );
    });

    it('validates ARIA attribute dependencies', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-expanded', 'true');

      const result = accessibilityManager.validateElement(div);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(
        'Element with aria-expanded should have aria-controls'
      );
    });
  });

  describe('getAccessibleName', () => {
    it('derives the accessible name from aria-label', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Close');

      expect(accessibilityManager.getAccessibleName(button)).toBe('Close');
    });

    it('uses associated labels when present', () => {
      const input = document.createElement('input');
      input.id = 'field';
      const label = document.createElement('label');
      label.htmlFor = 'field';
      label.textContent = 'Field Label';

      document.body.appendChild(input);
      document.body.appendChild(label);

      expect(accessibilityManager.getAccessibleName(input)).toBe('Field Label');
    });

    it('falls back to text content', () => {
      const button = document.createElement('button');
      button.textContent = 'Continue';

      expect(accessibilityManager.getAccessibleName(button)).toBe('Continue');
    });
  });
});

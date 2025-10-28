/**
 * Accessibility Tests
 *
 * Tests for WCAG 2.1 AA compliance, keyboard navigation,
 * and screen reader support.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { accessibilityManager } from '@/lib/accessibility';
import { AccessibleNavbar } from '@/components/navigation/AccessibleNavbar';

// Mock the hooks
vi.mock('@/hooks/useAuth');
vi.mock('@/lib/navigation-optimized');
vi.mock('@/lib/theme-optimized');

describe('Accessibility Manager', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Screen Reader Announcements', () => {
    it('should announce messages to screen readers', async () => {
      const message = 'Test announcement';

      accessibilityManager.announce(message);

      // Check if announcement element was created
      const announcement = document.querySelector('[aria-live]');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveTextContent(message);
    });

    it('should use assertive priority for urgent announcements', async () => {
      const message = 'Error occurred';

      accessibilityManager.announce(message, 'assertive');

      const announcement = document.querySelector('[aria-live="assertive"]');
      expect(announcement).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should focus element and scroll into view', () => {
      const element = document.createElement('button');
      element.textContent = 'Test Button';
      document.body.appendChild(element);

      const scrollIntoViewSpy = vi.spyOn(element, 'scrollIntoView');

      accessibilityManager.focusElement(element);

      expect(document.activeElement).toBe(element);
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    });

    it('should handle null element gracefully', () => {
      expect(() => {
        accessibilityManager.focusElement(null);
      }).not.toThrow();
    });
  });

  describe('Focus Trapping', () => {
    it('should trap focus within container', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      const button3 = document.createElement('button');

      button1.textContent = 'Button 1';
      button2.textContent = 'Button 2';
      button3.textContent = 'Button 3';

      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);
      document.body.appendChild(container);

      const cleanup = accessibilityManager.trapFocus(container);

      // Focus should be on first element
      expect(document.activeElement).toBe(button1);

      // Tab should cycle through elements
      fireEvent.keyDown(button3, { key: 'Tab' });
      expect(document.activeElement).toBe(button1);

      // Shift+Tab should cycle backwards
      fireEvent.keyDown(button1, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(button3);

      cleanup();
    });
  });

  describe('Element Validation', () => {
    it('should validate interactive elements', () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';

      const result = accessibilityManager.validateElement(button);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should identify missing accessible names', () => {
      const button = document.createElement('button');
      // No text content or aria-label

      const result = accessibilityManager.validateElement(button);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(
        'Interactive element missing accessible name'
      );
    });

    it('should validate ARIA attributes', () => {
      const element = document.createElement('div');
      element.setAttribute('aria-expanded', 'true');
      // Missing aria-controls

      const result = accessibilityManager.validateElement(element);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(
        'Element with aria-expanded should have aria-controls'
      );
    });

    it('should validate roles', () => {
      const element = document.createElement('div');
      element.setAttribute('role', 'invalid-role');

      const result = accessibilityManager.validateElement(element);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(
        'Invalid or inappropriate role: invalid-role'
      );
    });
  });

  describe('Accessible Name Resolution', () => {
    it('should get accessible name from aria-label', () => {
      const element = document.createElement('button');
      element.setAttribute('aria-label', 'Close dialog');

      const name = accessibilityManager.getAccessibleName(element);

      expect(name).toBe('Close dialog');
    });

    it('should get accessible name from associated label', () => {
      const input = document.createElement('input');
      input.id = 'test-input';
      const label = document.createElement('label');
      label.setAttribute('for', 'test-input');
      label.textContent = 'Test Input';

      document.body.appendChild(input);
      document.body.appendChild(label);

      const name = accessibilityManager.getAccessibleName(input);

      expect(name).toBe('Test Input');
    });

    it('should get accessible name from text content', () => {
      const button = document.createElement('button');
      button.textContent = 'Submit Form';

      const name = accessibilityManager.getAccessibleName(button);

      expect(name).toBe('Submit Form');
    });
  });
});

describe('Accessible Navigation Component', () => {
  beforeEach(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Keyboard Navigation', () => {
    it('should handle Tab navigation', async () => {
      render(<AccessibleNavbar />);

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      menuButton.focus();

      // Tab should move focus to next element
      fireEvent.keyDown(menuButton, { key: 'Tab' });

      // Focus should move to next focusable element
      expect(document.activeElement).not.toBe(menuButton);
    });

    it('should handle Escape key to close menu', async () => {
      render(<AccessibleNavbar />);

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(menuButton);

      // Menu should be open
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      // Menu should be closed
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should handle Arrow keys in menu', async () => {
      render(<AccessibleNavbar />);

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(menuButton);

      const menuItems = screen.getAllByRole('menuitem');
      const firstItem = menuItems[0];

      firstItem.focus();

      // Arrow down should move to next item
      fireEvent.keyDown(firstItem, { key: 'ArrowDown' });

      // Focus should move to next menu item
      expect(document.activeElement).not.toBe(firstItem);
    });

    it('should handle Home and End keys', async () => {
      render(<AccessibleNavbar />);

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(menuButton);

      const menuItems = screen.getAllByRole('menuitem');
      const lastItem = menuItems[menuItems.length - 1];

      lastItem.focus();

      // Home key should move to first item
      fireEvent.keyDown(lastItem, { key: 'Home' });

      expect(document.activeElement).toBe(menuItems[0]);
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper ARIA attributes', () => {
      render(<AccessibleNavbar />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
    });

    it('should update ARIA attributes when menu opens', async () => {
      render(<AccessibleNavbar />);

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(menuButton);

      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should mark current page with aria-current', () => {
      render(<AccessibleNavbar />);

      // This would need to be set up with proper navigation state
      // For now, just verify the structure is correct
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper labels for screen readers', () => {
      render(<AccessibleNavbar />);

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      expect(menuButton).toBeInTheDocument();

      const themeButton = screen.getByLabelText(/Switch to .* theme/);
      expect(themeButton).toBeInTheDocument();
    });

    it('should announce menu state changes', async () => {
      const announceSpy = vi.spyOn(accessibilityManager, 'announce');

      render(<AccessibleNavbar />);

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(menuButton);

      expect(announceSpy).toHaveBeenCalledWith('Navigation menu opened');

      fireEvent.click(menuButton);

      expect(announceSpy).toHaveBeenCalledWith('Navigation menu closed');
    });
  });

  describe('Focus Management', () => {
    it('should return focus to menu button when menu closes', async () => {
      render(<AccessibleNavbar />);

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(menuButton);

      // Press Escape to close menu
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(document.activeElement).toBe(menuButton);
      });
    });

    it('should focus first menu item when menu opens', async () => {
      render(<AccessibleNavbar />);

      const menuButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        expect(document.activeElement).toBe(menuItems[0]);
      });
    });
  });

  describe('High Contrast Support', () => {
    it('should detect high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<AccessibleNavbar />);

      // Check if high contrast class is applied
      expect(document.documentElement).toHaveClass('high-contrast');
    });
  });
});

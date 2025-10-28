/**
 * Accessibility Utilities
 *
 * Provides utilities for WCAG 2.1 AA compliance, keyboard navigation,
 * screen reader support, and focus management.
 */

export interface AccessibilityConfig {
  enableKeyboardNavigation: boolean;
  enableScreenReaderSupport: boolean;
  enableFocusManagement: boolean;
  enableHighContrast: boolean;
  announceChanges: boolean;
}

const DEFAULT_CONFIG: AccessibilityConfig = {
  enableKeyboardNavigation: true,
  enableScreenReaderSupport: true,
  enableFocusManagement: true,
  enableHighContrast: true,
  announceChanges: true,
};

class AccessibilityManager {
  private config: AccessibilityConfig;
  private focusHistory: HTMLElement[] = [];
  private currentFocusIndex = -1;

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Set up keyboard navigation
    if (this.config.enableKeyboardNavigation) {
      this.setupKeyboardNavigation();
    }

    // Set up focus management
    if (this.config.enableFocusManagement) {
      this.setupFocusManagement();
    }

    // Set up high contrast detection
    if (this.config.enableHighContrast) {
      this.setupHighContrastDetection();
    }
  }

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private setupFocusManagement(): void {
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
  }

  private setupHighContrastDetection(): void {
    // Check for high contrast mode
    const checkHighContrast = () => {
      const isHighContrast = window.matchMedia(
        '(prefers-contrast: high)'
      ).matches;
      document.documentElement.classList.toggle(
        'high-contrast',
        isHighContrast
      );
    };

    checkHighContrast();
    window
      .matchMedia('(prefers-contrast: high)')
      .addEventListener('change', checkHighContrast);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Skip if not in keyboard navigation mode
    if (!this.config.enableKeyboardNavigation) return;

    const { key, ctrlKey, altKey, metaKey } = event;
    const target = event.target as HTMLElement;

    // Handle common keyboard shortcuts
    switch (key) {
      case 'Tab':
        this.handleTabNavigation(event);
        break;
      case 'Escape':
        this.handleEscapeKey(target);
        break;
      case 'Enter':
      case ' ':
        this.handleActivationKey(event, target);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.handleArrowKeys(event, target);
        break;
      case 'Home':
        this.handleHomeKey(target);
        break;
      case 'End':
        this.handleEndKey(target);
        break;
    }

    // Handle modifier key combinations
    if (ctrlKey || altKey || metaKey) {
      this.handleModifierKeys(event, target);
    }
  }

  private handleTabNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(
      document.activeElement as HTMLElement
    );

    if (event.shiftKey) {
      // Shift + Tab: Move backwards
      if (currentIndex > 0) {
        event.preventDefault();
        focusableElements[currentIndex - 1].focus();
      }
    } else {
      // Tab: Move forwards
      if (currentIndex < focusableElements.length - 1) {
        event.preventDefault();
        focusableElements[currentIndex + 1].focus();
      }
    }
  }

  private handleEscapeKey(target: HTMLElement): void {
    // Close any open modals, dropdowns, or menus
    const modal = target.closest('[role="dialog"]');
    if (modal) {
      const closeButton = modal.querySelector(
        '[aria-label="Close"]'
      ) as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    }

    // Close dropdowns
    const dropdown = target.closest('[aria-expanded="true"]');
    if (dropdown) {
      (dropdown as HTMLElement).click();
    }
  }

  private handleActivationKey(event: KeyboardEvent, target: HTMLElement): void {
    // Prevent default space behavior on buttons
    if (event.key === ' ' && target.tagName === 'BUTTON') {
      event.preventDefault();
      target.click();
    }
  }

  private handleArrowKeys(event: KeyboardEvent, target: HTMLElement): void {
    const { key } = event;
    const container = target.closest(
      '[role="menu"], [role="tablist"], [role="radiogroup"]'
    );

    if (!container) return;

    event.preventDefault();
    const items = Array.from(
      container.querySelectorAll(
        '[role="menuitem"], [role="tab"], [role="radio"]'
      )
    ) as HTMLElement[];
    const currentIndex = items.indexOf(target);

    let nextIndex = currentIndex;
    switch (key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
    }

    if (nextIndex !== currentIndex) {
      items[nextIndex].focus();
    }
  }

  private handleHomeKey(target: HTMLElement): void {
    const container = target.closest(
      '[role="menu"], [role="tablist"], [role="radiogroup"]'
    );
    if (container) {
      const firstItem = container.querySelector(
        '[role="menuitem"], [role="tab"], [role="radio"]'
      ) as HTMLElement;
      if (firstItem) {
        firstItem.focus();
      }
    }
  }

  private handleEndKey(target: HTMLElement): void {
    const container = target.closest(
      '[role="menu"], [role="tablist"], [role="radiogroup"]'
    );
    if (container) {
      const items = container.querySelectorAll(
        '[role="menuitem"], [role="tab"], [role="radio"]'
      );
      const lastItem = items[items.length - 1] as HTMLElement;
      if (lastItem) {
        lastItem.focus();
      }
    }
  }

  private handleModifierKeys(event: KeyboardEvent, target: HTMLElement): void {
    const { key, ctrlKey, metaKey } = event;

    // Skip links (let browser handle them)
    if (target.tagName === 'A') return;

    // Common keyboard shortcuts
    if (ctrlKey || metaKey) {
      switch (key) {
        case 'k': {
          // Focus search
          event.preventDefault();
          const searchInput = document.querySelector(
            'input[type="search"], input[aria-label*="search" i]'
          ) as HTMLElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;
        }
        case 'h': {
          // Focus home
          event.preventDefault();
          const homeLink = document.querySelector('a[href="/"]') as HTMLElement;
          if (homeLink) {
            homeLink.focus();
          }
          break;
        }
      }
    }
  }

  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;

    // Add to focus history
    this.focusHistory.push(target);
    if (this.focusHistory.length > 10) {
      this.focusHistory.shift();
    }

    // Update focus index
    this.currentFocusIndex = this.focusHistory.length - 1;

    // Add focus indicator
    target.classList.add('focus-visible');
  }

  private handleFocusOut(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    target.classList.remove('focus-visible');
  }

  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[role="radio"]',
      '[role="checkbox"]',
    ];

    return Array.from(
      document.querySelectorAll(focusableSelectors.join(', '))
    ) as HTMLElement[];
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.enableScreenReaderSupport || !this.config.announceChanges)
      return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Set focus to an element
   */
  focusElement(element: HTMLElement | null): void {
    if (!element) return;

    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Trap focus within a container
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements().filter((el) =>
      container.contains(el)
    );

    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    firstElement.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Check if an element is visible to screen readers
   */
  isVisibleToScreenReader(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0 &&
      element.getAttribute('aria-hidden') !== 'true'
    );
  }

  /**
   * Get accessible name for an element
   */
  getAccessibleName(element: HTMLElement): string {
    // Check aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    // Check for associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent || '';
    }

    // Check for text content
    if (element.textContent) {
      return element.textContent.trim();
    }

    // Check for title attribute
    const title = element.getAttribute('title');
    if (title) return title;

    return '';
  }

  /**
   * Validate accessibility of an element
   */
  validateElement(element: HTMLElement): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for accessible name
    const accessibleName = this.getAccessibleName(element);
    if (!accessibleName && this.isInteractiveElement(element)) {
      issues.push('Interactive element missing accessible name');
    }

    // Check for proper ARIA attributes
    if (
      element.getAttribute('aria-expanded') &&
      !element.hasAttribute('aria-controls')
    ) {
      issues.push('Element with aria-expanded should have aria-controls');
    }

    // Check for proper roles
    if (
      element.hasAttribute('role') &&
      !this.isValidRole(element.getAttribute('role')!)
    ) {
      issues.push(
        `Invalid or inappropriate role: ${element.getAttribute('role')}`
      );
    }

    // Check for keyboard accessibility
    if (
      this.isInteractiveElement(element) &&
      !this.isKeyboardAccessible(element)
    ) {
      issues.push('Interactive element not keyboard accessible');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveRoles = [
      'button',
      'link',
      'menuitem',
      'tab',
      'radio',
      'checkbox',
      'textbox',
      'combobox',
      'listbox',
      'option',
    ];

    const role = element.getAttribute('role');
    if (role && interactiveRoles.includes(role)) return true;

    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
    return interactiveTags.includes(element.tagName.toLowerCase());
  }

  private isValidRole(role: string): boolean {
    const validRoles = [
      'button',
      'link',
      'menuitem',
      'tab',
      'tablist',
      'tabpanel',
      'radio',
      'radiogroup',
      'checkbox',
      'textbox',
      'combobox',
      'listbox',
      'option',
      'menu',
      'menubar',
      'dialog',
      'alert',
      'status',
      'log',
      'marquee',
      'timer',
      'progressbar',
    ];

    return validRoles.includes(role);
  }

  private isKeyboardAccessible(element: HTMLElement): boolean {
    // Check if element can receive focus
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex === '-1') return false;

    // Check if element has keyboard event handlers
    const hasKeyboardHandlers =
      element.onkeydown !== null || element.onkeyup !== null;

    return hasKeyboardHandlers || element.tagName.toLowerCase() === 'button';
  }
}

// Global accessibility manager instance
export const accessibilityManager = new AccessibilityManager();

/**
 * React hook for accessibility management
 */
export function useAccessibility() {
  const announce = React.useCallback(
    (message: string, priority?: 'polite' | 'assertive') => {
      accessibilityManager.announce(message, priority);
    },
    []
  );

  const focusElement = React.useCallback((element: HTMLElement | null) => {
    accessibilityManager.focusElement(element);
  }, []);

  const trapFocus = React.useCallback((container: HTMLElement) => {
    return accessibilityManager.trapFocus(container);
  }, []);

  return {
    announce,
    focusElement,
    trapFocus,
    validateElement:
      accessibilityManager.validateElement.bind(accessibilityManager),
  };
}

// React import
import React from 'react';

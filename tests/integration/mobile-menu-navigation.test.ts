/**
 * Integration test for mobile menu navigation behavior
 *
 * Tests that the mobile menu closes when navigating to another page
 * while on mobile devices.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMobileMenu } from '@/hooks/useMobileMenu';

// Mock Next.js navigation
const mockPathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

describe('Mobile Menu Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/');
  });

  it('should close mobile menu when pathname changes (simulating navigation)', () => {
    const { result, rerender } = renderHook(() => useMobileMenu());

    // Open mobile menu
    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    // Simulate navigation to another page by changing pathname
    act(() => {
      mockPathname.mockReturnValue('/players');
      rerender(); // Trigger re-render with new pathname
    });

    // The menu should close when pathname changes
    expect(result.current.isOpen).toBe(false);
  });

  it('should close mobile menu when navigating to home page', () => {
    // Start from a different page
    mockPathname.mockReturnValue('/players');

    const { result, rerender } = renderHook(() => useMobileMenu());

    // Open mobile menu
    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    // Simulate navigation to home page
    act(() => {
      mockPathname.mockReturnValue('/');
      rerender(); // Trigger re-render with new pathname
    });

    // The menu should close when pathname changes
    expect(result.current.isOpen).toBe(false);
  });

  it('should close mobile menu when navigating between different pages', () => {
    const { result, rerender } = renderHook(() => useMobileMenu());

    // Start from home page
    mockPathname.mockReturnValue('/');

    // Open mobile menu
    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    // Navigate to players page
    act(() => {
      mockPathname.mockReturnValue('/players');
      rerender();
    });

    expect(result.current.isOpen).toBe(false);

    // Open menu again
    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    // Navigate to tournaments page
    act(() => {
      mockPathname.mockReturnValue('/tournaments');
      rerender();
    });

    // Menu should close again
    expect(result.current.isOpen).toBe(false);
  });
});

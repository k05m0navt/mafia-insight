/**
 * Responsive utility functions and constants
 *
 * Provides utilities for responsive design with mobile-first approach
 * Breakpoints: 320px (xs), 768px (sm), 1024px (md), 1440px (lg)
 */

export const BREAKPOINTS = {
  xs: 320,
  sm: 768,
  md: 1024,
  lg: 1440,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Responsive spacing utilities
 * Provides consistent spacing that scales with screen size
 */
export const responsiveSpacing = {
  // Container padding
  containerPadding: {
    mobile: 'px-4', // 16px
    tablet: 'sm:px-6', // 24px
    desktop: 'md:px-8', // 32px
    large: 'lg:px-12', // 48px
  },
  // Section spacing
  sectionGap: {
    mobile: 'gap-4', // 16px
    tablet: 'sm:gap-6', // 24px
    desktop: 'md:gap-8', // 32px
    large: 'lg:gap-12', // 48px
  },
} as const;

/**
 * Responsive typography utilities
 * Font sizes that adapt to screen size
 */
export const responsiveTypography = {
  h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
  h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
  h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
  h4: 'text-base sm:text-lg md:text-xl lg:text-2xl',
  body: 'text-sm sm:text-base md:text-base lg:text-lg',
  small: 'text-xs sm:text-sm md:text-sm lg:text-base',
} as const;

/**
 * Mobile-first responsive class builder
 * Combines base classes with responsive variants
 */
export function responsiveClass(
  base: string,
  variants: {
    sm?: string;
    md?: string;
    lg?: string;
  }
): string {
  const classes = [base];
  if (variants.sm) classes.push(`sm:${variants.sm}`);
  if (variants.md) classes.push(`md:${variants.md}`);
  if (variants.lg) classes.push(`lg:${variants.lg}`);
  return classes.join(' ');
}

/**
 * Check if current viewport matches a breakpoint
 * Useful for client-side responsive logic
 */
export function matchesBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
}

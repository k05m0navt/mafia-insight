import { cn } from '@/lib/utils';

/**
 * Animation and transition utilities
 * Provides consistent animations that respect prefers-reduced-motion
 */

/**
 * Base transition classes that respect prefers-reduced-motion
 */
export const transitions = {
  /**
   * Fast transition (150ms)
   */
  fast: 'transition-all duration-150 ease-in-out',
  /**
   * Default transition (200ms)
   */
  default: 'transition-all duration-200 ease-in-out',
  /**
   * Slow transition (300ms)
   */
  slow: 'transition-all duration-300 ease-in-out',
  /**
   * Very slow transition (500ms)
   */
  verySlow: 'transition-all duration-500 ease-in-out',
} as const;

/**
 * Transition presets for common interactions
 */
export const transitionPresets = {
  /**
   * Button hover transition
   */
  button: 'transition-colors duration-200 ease-in-out',
  /**
   * Card hover transition (elevation change)
   */
  card: 'transition-all duration-200 ease-in-out',
  /**
   * Input focus transition
   */
  input: 'transition-all duration-150 ease-in-out',
  /**
   * Modal/dialog transition
   */
  modal: 'transition-all duration-300 ease-out',
  /**
   * Page transition
   */
  page: 'transition-opacity duration-200 ease-in-out',
  /**
   * Fade in animation
   */
  fadeIn: 'animate-in fade-in duration-300',
  /**
   * Slide in from top
   */
  slideInTop: 'animate-in slide-in-from-top-4 duration-300',
  /**
   * Slide in from bottom
   */
  slideInBottom: 'animate-in slide-in-from-bottom-4 duration-300',
  /**
   * Slide in from left
   */
  slideInLeft: 'animate-in slide-in-from-left-4 duration-300',
  /**
   * Slide in from right
   */
  slideInRight: 'animate-in slide-in-from-right-4 duration-300',
} as const;

/**
 * Animation utilities that respect prefers-reduced-motion
 * Wraps animation classes with motion-safe prefix
 */
export const animations = {
  /**
   * Fade in animation
   */
  fadeIn: 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300',
  /**
   * Fade out animation
   */
  fadeOut:
    'motion-safe:animate-out motion-safe:fade-out motion-safe:duration-200',
  /**
   * Scale in animation
   */
  scaleIn:
    'motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200',
  /**
   * Scale out animation
   */
  scaleOut:
    'motion-safe:animate-out motion-safe:zoom-out-95 motion-safe:duration-200',
  /**
   * Spin animation (for loaders)
   */
  spin: 'motion-safe:animate-spin',
  /**
   * Pulse animation
   */
  pulse: 'motion-safe:animate-pulse',
  /**
   * Bounce animation
   */
  bounce: 'motion-safe:animate-bounce',
} as const;

/**
 * Combine transition classes with custom classes
 * Automatically respects prefers-reduced-motion
 */
export function transitionClass(
  preset: keyof typeof transitionPresets,
  customClasses?: string
): string {
  return cn(transitionPresets[preset], customClasses);
}

/**
 * Combine animation classes with custom classes
 * Automatically respects prefers-reduced-motion
 */
export function animationClass(
  animation: keyof typeof animations,
  customClasses?: string
): string {
  return cn(animations[animation], customClasses);
}

/**
 * Hover effect classes for interactive elements
 */
export const hoverEffects = {
  /**
   * Lift effect on hover (shadow increase)
   */
  lift: 'transition-shadow duration-200 hover:shadow-lg',
  /**
   * Scale up slightly on hover
   */
  scale: 'transition-transform duration-200 hover:scale-105',
  /**
   * Brightness increase on hover
   */
  brighten: 'transition-all duration-200 hover:brightness-110',
  /**
   * Opacity change on hover
   */
  opacity: 'transition-opacity duration-200 hover:opacity-80',
} as const;

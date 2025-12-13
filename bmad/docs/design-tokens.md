# Mafia Insight - Design Tokens

_Created on 2025-01-27_  
_Based on Refined Professional Design Direction (#9)_

---

## Overview

Design tokens are the visual design atoms of the design system. They define colors, typography, spacing, shadows, borders, and other design properties that ensure consistency across the platform.

---

## 1. Color Tokens

### 1.1 Primary Colors

**Light Theme:**

```css
--color-primary: #4f46e5; /* Deep Indigo - Main actions, primary buttons */
--color-primary-hover: #4338ca; /* Darker indigo for hover states */
--color-primary-light: #6366f1; /* Lighter indigo variant */
--color-primary-foreground: #ffffff; /* Text on primary background */

--color-secondary: #06b6d4; /* Cyan - Supporting actions, data viz */
--color-secondary-hover: #0891b2; /* Darker cyan for hover */
--color-secondary-foreground: #ffffff;

--color-accent: #8b5cf6; /* Purple - Highlights, achievements */
--color-accent-hover: #7c3aed; /* Darker purple for hover */
--color-accent-foreground: #ffffff;
```

**Dark Theme:**

```css
--color-primary: #6366f1; /* Lighter indigo for dark theme */
--color-primary-hover: #4f46e5; /* Standard indigo */
--color-primary-light: #818cf8; /* Even lighter variant */
--color-primary-foreground: #ffffff;

--color-secondary: #06b6d4; /* Same cyan */
--color-secondary-hover: #0891b2;
--color-secondary-foreground: #ffffff;

--color-accent: #a855f7; /* Lighter purple for dark theme */
--color-accent-hover: #8b5cf6;
--color-accent-foreground: #ffffff;
```

### 1.2 Semantic Colors

**Success:**

```css
--color-success: #10b981; /* Emerald - Positive actions, success states */
--color-success-hover: #059669;
--color-success-foreground: #ffffff;
--color-success-light: #14b8a6; /* Lighter variant for gradients */
```

**Warning:**

```css
--color-warning: #f59e0b; /* Amber - Warnings, important notices */
--color-warning-hover: #d97706;
--color-warning-foreground: #ffffff;
```

**Error:**

```css
--color-error: #ef4444; /* Red - Errors, destructive actions */
--color-error-hover: #dc2626;
--color-error-foreground: #ffffff;
```

**Info:**

```css
--color-info: #3b82f6; /* Blue - Informational messages, links */
--color-info-hover: #2563eb;
--color-info-foreground: #ffffff;
```

### 1.3 Neutral Colors

**Light Theme:**

```css
/* Backgrounds */
--color-background: #ffffff; /* Primary background */
--color-surface: #f8fafc; /* Card backgrounds, elevated surfaces */
--color-surface-hover: #f1f5f9; /* Hover state for surfaces */
--color-surface-active: #e0e7ff; /* Active state (sidebar items) */

/* Borders */
--color-border: #e2e8f0; /* Standard borders */
--color-border-hover: #4f46e5; /* Border on hover */
--color-border-focus: #6366f1; /* Border on focus */

/* Text */
--color-text-primary: #0f172a; /* Primary text (headings, body) */
--color-text-secondary: #64748b; /* Secondary text (labels, descriptions) */
--color-text-muted: #94a3b8; /* Muted text (placeholders, hints) */
--color-text-disabled: #cbd5e1; /* Disabled text */
```

**Dark Theme:**

```css
/* Backgrounds */
--color-background: #0f172a; /* Primary background (slate 900) */
--color-surface: #1e293b; /* Card backgrounds (slate 800) */
--color-surface-hover: #334155; /* Hover state (slate 700) */
--color-surface-active: rgba(79, 70, 229, 0.2); /* Active state with opacity */

/* Borders */
--color-border: #334155; /* Standard borders (slate 700) */
--color-border-hover: #6366f1; /* Border on hover */
--color-border-focus: #818cf8; /* Border on focus */

/* Text */
--color-text-primary: #f8fafc; /* Primary text (slate 50) */
--color-text-secondary: #94a3b8; /* Secondary text (slate 400) */
--color-text-muted: #64748b; /* Muted text (slate 500) */
--color-text-disabled: #475569; /* Disabled text (slate 600) */
```

### 1.4 Role-Specific Colors

**Don:**

```css
--color-role-don: #4f46e5; /* Deep Indigo */
--color-role-don-light: #6366f1; /* Lighter variant */
--color-role-don-gradient: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
--color-role-don-shadow: rgba(79, 70, 229, 0.3);
--color-role-don-shadow-hover: rgba(79, 70, 229, 0.5);
```

**Mafia:**

```css
--color-role-mafia: #06b6d4; /* Cyan */
--color-role-mafia-light: #3b82f6; /* Blue variant */
--color-role-mafia-gradient: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
--color-role-mafia-shadow: rgba(6, 182, 212, 0.3);
--color-role-mafia-shadow-hover: rgba(6, 182, 212, 0.5);
```

**Sheriff:**

```css
--color-role-sheriff: #8b5cf6; /* Purple */
--color-role-sheriff-light: #a855f7; /* Lighter purple */
--color-role-sheriff-gradient: linear-gradient(
  135deg,
  #8b5cf6 0%,
  #a855f7 100%
);
--color-role-sheriff-shadow: rgba(139, 92, 246, 0.3);
--color-role-sheriff-shadow-hover: rgba(139, 92, 246, 0.5);
```

**Citizen:**

```css
--color-role-citizen: #10b981; /* Emerald */
--color-role-citizen-light: #14b8a6; /* Teal variant */
--color-role-citizen-gradient: linear-gradient(
  135deg,
  #10b981 0%,
  #14b8a6 100%
);
--color-role-citizen-shadow: rgba(16, 185, 129, 0.3);
--color-role-citizen-shadow-hover: rgba(16, 185, 129, 0.5);
```

---

## 2. Typography Tokens

### 2.1 Font Families

```css
--font-family-base:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
  Arial, sans-serif;
--font-family-mono:
  ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
```

### 2.2 Font Sizes

```css
--font-size-xs: 0.75rem; /* 12px - Labels, metadata */
--font-size-sm: 0.875rem; /* 14px - Secondary text, captions */
--font-size-base: 1rem; /* 16px - Body text */
--font-size-lg: 1.125rem; /* 18px - Small headings */
--font-size-xl: 1.25rem; /* 20px - Component titles */
--font-size-2xl: 1.5rem; /* 24px - Subsection headers */
--font-size-3xl: 2rem; /* 32px - Section headers */
--font-size-4xl: 2.5rem; /* 40px - Page titles, hero sections */
```

### 2.3 Font Weights

```css
--font-weight-normal: 400; /* Regular - Body text */
--font-weight-medium: 500; /* Medium - Subtle emphasis */
--font-weight-semibold: 600; /* Semibold - Subheadings, button text */
--font-weight-bold: 700; /* Bold - Headings, emphasis, metrics */
```

### 2.4 Line Heights

```css
--line-height-tight: 1.2; /* Headings - tight for visual hierarchy */
--line-height-normal: 1.5; /* Small text - compact but readable */
--line-height-relaxed: 1.6; /* Body text - comfortable reading */
--line-height-loose: 1.8; /* Long-form content */
```

### 2.5 Letter Spacing

```css
--letter-spacing-tight: -0.02em; /* Headings - slightly tighter */
--letter-spacing-normal: 0; /* Body text - normal */
--letter-spacing-wide: 0.05em; /* Uppercase labels, badges */
```

---

## 3. Spacing Tokens

### 3.1 Base Unit

All spacing uses a 4px base unit for consistency.

### 3.2 Spacing Scale

```css
--spacing-0: 0; /* 0px */
--spacing-1: 0.25rem; /* 4px - Tight spacing, icon padding */
--spacing-2: 0.5rem; /* 8px - Small gaps, compact layouts */
--spacing-3: 0.75rem; /* 12px - Medium-small gaps */
--spacing-4: 1rem; /* 16px - Standard spacing, component padding */
--spacing-5: 1.25rem; /* 20px */
--spacing-6: 1.5rem; /* 24px - Section spacing, card padding */
--spacing-8: 2rem; /* 32px - Large gaps, section margins */
--spacing-10: 2.5rem; /* 40px */
--spacing-12: 3rem; /* 48px - Major section separation */
--spacing-16: 4rem; /* 64px - Page-level spacing */
```

### 3.3 Component-Specific Spacing

```css
/* Sidebar */
--sidebar-width: 240px;
--sidebar-padding-x: 1rem;
--sidebar-padding-y: 1.5rem;
--sidebar-item-padding: 0.75rem;
--sidebar-item-gap: 0.5rem;

/* Cards */
--card-padding: 1.5rem;
--card-padding-mobile: 1rem;
--card-gap: 1rem;
--card-gap-mobile: 0.75rem;

/* Stat Cards */
--stat-card-padding: 1.5rem;
--stat-card-gap: 1rem;
--stat-card-grid-columns: 4; /* Desktop */
--stat-card-grid-columns-mobile: 2;

/* Role Performance Cards */
--role-card-padding: 2rem 1.5rem;
--role-card-padding-mobile: 1.5rem 1.25rem;
--role-card-gap: 1rem;
--role-card-gap-mobile: 0.75rem;

/* Content Areas */
--content-padding: 1.5rem;
--content-padding-mobile: 1rem;
--section-margin-bottom: 1.5rem;
--section-margin-bottom-mobile: 1rem;
```

---

## 4. Border Tokens

### 4.1 Border Widths

```css
--border-width-thin: 1px; /* Standard borders */
--border-width-medium: 2px; /* Emphasis borders (stat cards) */
--border-width-thick: 3px; /* Strong emphasis (rare) */
```

### 4.2 Border Radius

```css
--radius-none: 0;
--radius-sm: 6px; /* Small elements (inputs, badges) */
--radius-md: 8px; /* Medium elements (buttons, sidebar items) */
--radius-lg: 12px; /* Large elements (cards, panels) */
--radius-xl: 16px; /* Extra large (role performance cards) */
--radius-full: 9999px; /* Fully rounded (pills, avatars) */
```

---

## 5. Shadow Tokens

### 5.1 Elevation Levels

**Light Theme:**

```css
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05); /* Subtle elevation */
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.05); /* Cards, panels */
--shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.1); /* Elevated cards */
--shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.15); /* Modals, dropdowns */
--shadow-2xl: 0 12px 48px rgba(0, 0, 0, 0.2); /* Maximum elevation */
```

**Dark Theme:**

```css
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.15);
--shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.2);
--shadow-2xl: 0 12px 48px rgba(0, 0, 0, 0.3);
```

### 5.2 Colored Shadows

**Primary (Indigo):**

```css
--shadow-primary-sm: 0 2px 8px rgba(79, 70, 229, 0.2);
--shadow-primary-md: 0 4px 12px rgba(79, 70, 229, 0.2);
--shadow-primary-lg: 0 8px 24px rgba(79, 70, 229, 0.3);
--shadow-primary-xl: 0 8px 24px rgba(99, 102, 241, 0.4); /* Dark theme hover */
```

**Role-Specific Shadows:**

```css
--shadow-role-don: 0 4px 12px rgba(79, 70, 229, 0.3);
--shadow-role-don-hover: 0 8px 24px rgba(79, 70, 229, 0.5);

--shadow-role-mafia: 0 4px 12px rgba(6, 182, 212, 0.3);
--shadow-role-mafia-hover: 0 8px 24px rgba(6, 182, 212, 0.5);

--shadow-role-sheriff: 0 4px 12px rgba(139, 92, 246, 0.3);
--shadow-role-sheriff-hover: 0 8px 24px rgba(139, 92, 246, 0.5);

--shadow-role-citizen: 0 4px 12px rgba(16, 185, 129, 0.3);
--shadow-role-citizen-hover: 0 8px 24px rgba(16, 185, 129, 0.5);
```

---

## 6. Gradient Tokens

### 6.1 Background Gradients

**Stat Cards:**

```css
--gradient-stat-card-light: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
--gradient-stat-card-dark: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
```

**Primary Buttons:**

```css
--gradient-primary: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
```

**Role Performance Cards:**

```css
--gradient-role-don: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
--gradient-role-mafia: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
--gradient-role-sheriff: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
--gradient-role-citizen: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
```

---

## 7. Animation Tokens

### 7.1 Duration

```css
--duration-fast: 0.15s; /* Quick interactions */
--duration-normal: 0.2s; /* Standard transitions */
--duration-slow: 0.3s; /* Smooth animations */
--duration-slower: 0.5s; /* Complex animations */
```

### 7.2 Easing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1); /* Smooth, natural feel */
```

### 7.3 Transform Values

```css
/* Hover Transforms */
--transform-lift: translateY(-2px);
--transform-lift-large: translateY(-4px);
--transform-slide: translateX(4px);
--transform-scale: scale(1.02);
--transform-scale-large: scale(1.05);
```

---

## 8. Z-Index Tokens

```css
--z-base: 0;
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

---

## 9. Breakpoint Tokens

```css
--breakpoint-mobile: 320px;
--breakpoint-mobile-max: 767px;
--breakpoint-tablet: 768px;
--breakpoint-tablet-max: 1023px;
--breakpoint-desktop: 1024px;
--breakpoint-desktop-lg: 1400px;
```

**Usage:**

```css
/* Mobile */
@media (max-width: 767px) {
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
}

/* Desktop */
@media (min-width: 1024px) {
}

/* Large Desktop */
@media (min-width: 1400px) {
}
```

---

## 10. Icon Tokens

### 10.1 Icon Sizes

```css
--icon-size-xs: 0.75rem; /* 12px */
--icon-size-sm: 1rem; /* 16px */
--icon-size-md: 1.25rem; /* 20px - Standard sidebar icons */
--icon-size-lg: 1.5rem; /* 24px - Stat card icons */
--icon-size-xl: 1.75rem; /* 28px - Large icons */
--icon-size-2xl: 2rem; /* 32px - Role card icons */
```

### 10.2 Icon Spacing

```css
--icon-gap-sm: 0.5rem; /* 8px - Tight spacing */
--icon-gap-md: 0.75rem; /* 12px - Standard spacing */
--icon-gap-lg: 1rem; /* 16px - Loose spacing */
```

---

## 11. Opacity Tokens

```css
--opacity-disabled: 0.5;
--opacity-hover: 0.8;
--opacity-muted: 0.85;
--opacity-subtle: 0.9;
--opacity-full: 1;
```

**Usage in Role Cards:**

```css
--opacity-role-name: 0.95;
--opacity-role-badge: 0.85;
--opacity-role-count: 0.8;
--opacity-role-decorative: 0.1; /* Decorative circle background */
```

---

## 12. Implementation Notes

### 12.1 CSS Variables Format

All tokens should be defined as CSS custom properties for easy theming:

```css
:root {
  /* Light theme tokens */
  --color-primary: #4f46e5;
  --spacing-4: 1rem;
  /* ... */
}

.dark {
  /* Dark theme overrides */
  --color-primary: #6366f1;
  /* ... */
}
```

### 12.2 Tailwind Integration

For Tailwind CSS projects, tokens can be mapped to Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        // ...
      },
      spacing: {
        // Use spacing tokens
      },
      // ...
    },
  },
};
```

### 12.3 TypeScript/JavaScript Usage

For programmatic access, create a tokens object:

```typescript
export const tokens = {
  colors: {
    primary: '#4f46e5',
    // ...
  },
  spacing: {
    sm: '0.5rem',
    // ...
  },
  // ...
} as const;
```

---

## 13. Token Naming Convention

**Format:** `--category-subcategory-variant-state`

**Examples:**

- `--color-primary-hover` (color category, primary subcategory, hover state)
- `--spacing-card-padding` (spacing category, card subcategory)
- `--shadow-role-don-hover` (shadow category, role-don subcategory, hover state)

**Categories:**

- `color` - All color values
- `spacing` - All spacing values
- `typography` - Font families, sizes, weights
- `border` - Border widths, radius
- `shadow` - Box shadows
- `gradient` - Background gradients
- `animation` - Durations, easing, transforms
- `z-index` - Layering values
- `breakpoint` - Media query breakpoints
- `icon` - Icon sizes and spacing
- `opacity` - Opacity values

---

_This token system ensures consistency and makes theming and maintenance straightforward._

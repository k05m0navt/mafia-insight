# Visual Assets Guide

This guide documents the visual asset system implemented to satisfy AC1.2: "High-quality images and visual assets that enhance the analytics experience."

## Overview

The visual asset system provides:

- **High-quality images** via Next.js Image optimization
- **SVG illustrations** for analytics pages
- **Consistent styling** across all visual elements
- **Accessibility support** (ARIA labels, alt text)
- **Responsive design** that adapts to all screen sizes

## Components

### VisualAsset

The base component for displaying images and illustrations.

**Location:** `src/components/ui/visual-asset.tsx`

**Props:**

- `variant`: `'hero' | 'empty-state' | 'illustration' | 'decorative'` - Visual style variant
- `src`: Image source path (relative to `/public` or absolute URL)
- `alt`: Alt text for accessibility (required for images)
- `width`: Image width
- `height`: Image height
- `decorative`: Whether the asset is decorative (hidden from screen readers)
- `priority`: Priority loading for above-the-fold images
- `children`: SVG illustration content (alternative to `src`)

**Example:**

```tsx
import { VisualAsset } from '@/components/ui/visual-asset';

// Image asset
<VisualAsset
  variant="hero"
  src="/images/analytics-hero.svg"
  alt="Analytics dashboard illustration"
  width={800}
  height={400}
  priority
/>

// SVG illustration
<VisualAsset variant="illustration">
  <AnalyticsHeroIllustration />
</VisualAsset>
```

### Analytics Illustrations

Pre-built SVG illustrations for analytics pages.

**Location:** `src/components/ui/analytics-illustrations.tsx`

**Available Illustrations:**

- `AnalyticsHeroIllustration` - Hero section illustration with charts and metrics
- `AnalyticsEmptyStateIllustration` - Empty state illustration
- `PerformanceMetricsIllustration` - Performance metrics visualization

**Example:**

```tsx
import { AnalyticsHeroIllustration } from '@/components/ui/analytics-illustrations';
import { VisualAsset } from '@/components/ui/visual-asset';

<VisualAsset variant="hero">
  <AnalyticsHeroIllustration width={600} height={300} />
</VisualAsset>;
```

### AnalyticsHero

Ready-to-use hero section component for analytics pages.

**Location:** `src/components/analytics/AnalyticsHero.tsx`

**Props:**

- `title`: Hero title
- `subtitle`: Optional subtitle
- `showIllustration`: Whether to show the hero illustration (default: true)

**Example:**

```tsx
import { AnalyticsHero } from '@/components/analytics/AnalyticsHero';

<AnalyticsHero
  title="Player Analytics"
  subtitle="Comprehensive performance insights"
/>;
```

### AnalyticsEmptyState

Ready-to-use empty state component with visual asset.

**Location:** `src/components/analytics/AnalyticsEmptyState.tsx`

**Props:**

- `title`: Empty state title
- `description`: Optional description
- `action`: Optional action button

**Example:**

```tsx
import { AnalyticsEmptyState } from '@/components/analytics/AnalyticsEmptyState';

<AnalyticsEmptyState
  title="No data available"
  description="Start playing games to see your analytics"
/>;
```

## Usage Guidelines

### When to Use Visual Assets

1. **Hero Sections**: Use `AnalyticsHero` or `VisualAsset` with `variant="hero"` for page headers
2. **Empty States**: Use `AnalyticsEmptyState` or `VisualAsset` with `variant="empty-state"` when no data is available
3. **Illustrations**: Use SVG illustrations for decorative elements that enhance understanding
4. **Images**: Use `VisualAsset` with `src` prop for actual image files

### Accessibility

- **Always provide alt text** for images (unless decorative)
- **Mark decorative assets** with `decorative={true}`
- **Use semantic HTML** and ARIA attributes appropriately
- **Test with screen readers** to ensure proper accessibility

### Performance

- **Use `priority` prop** for above-the-fold images
- **Optimize image sizes** before adding to `/public`
- **Prefer SVG illustrations** for scalable graphics
- **Lazy load** below-the-fold images

### Responsive Design

All visual assets are responsive by default:

- **Hero variant**: Max width 4xl, centers on large screens
- **Empty state variant**: Max width md, centers on all screens
- **Illustration variant**: Full width, maintains aspect ratio

## File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── visual-asset.tsx          # Base VisualAsset component
│   │   └── analytics-illustrations.tsx # SVG illustrations
│   └── analytics/
│       ├── AnalyticsHero.tsx         # Hero section component
│       └── AnalyticsEmptyState.tsx  # Empty state component
public/
└── images/                           # Image assets directory
    └── (add image files here)
```

## Testing

Visual assets are tested in:

- `tests/components/visual-asset.test.tsx` - Component tests
- E2E tests verify visual assets render correctly
- Accessibility tests ensure proper ARIA attributes

## Design System Integration

Visual assets use the Competitive Data theme colors:

- **Primary**: Deep Indigo (#4f46e5)
- **Secondary**: Cyan (#06b6d4)
- **Accent**: Purple (#8b5cf6)

All illustrations respect light/dark mode via CSS variables.

## References

- [Next.js Image Optimization](https://nextjs.org/docs/pages/api-reference/components/image)
- [WCAG 2.1 Image Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/images.html)
- Story 1.1: Visual Design System Foundation (AC1.2)

# Component Library Documentation

**Last Updated:** 2025-01-27  
**Story:** 3-4-component-discovery-and-documentation

## Overview

This document provides comprehensive documentation for the mafia-insight component library, including existing components, discovered components from registries, and usage guidelines.

## Component Discovery Tools

### shadcn MCP Server

The shadcn MCP server provides programmatic access to component registries for discovery and integration.

**Usage:**

- List registries: `get_project_registries()`
- List items: `list_items_in_registries(registries)`
- Search items: `search_items_in_registries(registries, query)`
- View details: `view_items_in_registries(items)`
- Get examples: `get_item_examples_from_registries(registries, query)`

**Example:**

```typescript
// Discover components from @aceternity registry
const items = await list_items_in_registries(['@aceternity']);
const analytics = await search_items_in_registries(
  ['@aceternity'],
  'analytics dashboard'
);
```

### context7 MCP Server

The context7 MCP server provides access to up-to-date library documentation.

**Usage:**

- Resolve library ID: `resolve-library-id(libraryName)`
- Get documentation: `get-library-docs(context7CompatibleLibraryID, mode, topic)`

**Example:**

```typescript
// Get Storybook documentation
const storybookId = (await resolve) - library - id('storybook');
const docs =
  (await get) -
  library -
  docs('/storybookjs/storybook', 'code', 'nextjs setup');
```

## Existing Components

### Core UI Components

All components are located in `src/components/ui/` and use the `tailwind-variants` pattern.

#### Card Component

**Location:** `src/components/ui/card.tsx`

**Variants:**

- `default` - Standard card with subtle shadow
- `elevated` - Enhanced shadow with hover effect
- `outlined` - Border emphasis, no shadow
- `ghost` - Transparent background
- `interactive` - Clickable with hover states
- `metric` - Optimized for large numbers (8px radius, 20px padding)
- `chart` - Full chart display area
- `info` - Text content with icon support
- `role` - Role-based color theming (12px radius, 24px padding)

**Storybook:** `src/components/ui/card.stories.tsx`

#### Badge Component

**Location:** `src/components/ui/badge.tsx`

**Variants:**

- `default` - Primary styling
- `secondary` - Secondary styling
- `destructive` - Error/warning styling
- `outline` - Border only

**Storybook:** `src/components/ui/badge.stories.tsx`

#### Button Component

**Location:** `src/components/ui/button.tsx`

**Variants:**

- `default` - Primary button
- `destructive` - Dangerous actions
- `outline` - Outlined style
- `secondary` - Secondary actions
- `ghost` - Minimal styling
- `link` - Link appearance

**Sizes:**

- `sm` - Small
- `default` - Default
- `lg` - Large
- `icon` - Icon only

**Storybook:** `src/components/ui/button.stories.tsx`

#### Alert Component

**Location:** `src/components/ui/alert.tsx`

**Variants:**

- `default` - Standard alert
- `destructive` - Error/warning alert

**Storybook:** `src/components/ui/alert.stories.tsx`

## Discovered Components

### Recommended Components from @aceternity

See `component-discovery-report.md` for detailed evaluation.

**Top Recommendations:**

1. `layout-grid` - Dashboard layouts
2. `bento-grid` - Metric card organization
3. `animated-tooltip` - Data point tooltips
4. `card-hover-effect` - Interactive cards
5. `tabs` - Tabbed analytics views

## Adding Components from Registries

### Integration Process

1. **Discover Component:**

   ```bash
   npx shadcn@latest view @registry-name/component-name
   ```

2. **Add Component:**

   ```bash
   npx shadcn@latest add @registry-name/component-name
   ```

3. **Migration Steps:**
   - Replace `class-variance-authority` with `tailwind-variants` if present
   - Update icon imports to use `lucide-react`
   - Align spacing/padding with design guide
   - Add JSDoc documentation
   - Create Storybook story

4. **Example Migration:**

   ```typescript
   // Before (class-variance-authority)
   import { cva } from 'class-variance-authority';

   // After (tailwind-variants)
   import { tv } from 'tailwind-variants';
   ```

### Design System Alignment

All components must:

- Use `tailwind-variants` with `tv()` function
- Follow design guide specifications
- Support light/dark themes
- Meet WCAG 2.1 AA accessibility standards
- Include TypeScript types using `VariantProps`

## Storybook Documentation

### Running Storybook

```bash
npm run storybook
```

### Build Warnings

**Note:** When building Storybook (`npm run build-storybook`), you may see warnings about "use client" directives being ignored. This is **expected behavior** and does not affect functionality:

```
Module level directives cause errors when bundled, "use client" in
"src/components/ui/animated-tabs.tsx" was ignored.
```

**Explanation:** Storybook doesn't need Next.js client directives since it runs in its own environment. These warnings can be safely ignored. The components will work correctly in both Storybook and Next.js applications.

### Story Structure

Stories are co-located with components in `src/components/ui/*.stories.tsx`.

**Example:**

```typescript
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Component } from './component';

const meta = {
  title: 'UI/Component',
  component: Component,
  tags: ['autodocs'],
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // component props
  },
};
```

### Theme Support

Storybook includes theme switching via the toolbar:

- Light mode
- Dark mode

Theme is applied via decorators in `.storybook/preview.ts`.

## Component Inventory

### Current Components

- alert
- alert-dialog
- avatar
- badge
- button
- card
- checkbox
- dialog
- dropdown-menu
- form
- input
- label
- navigation-menu
- pagination
- popover
- progress
- radio-group
- scroll-area
- select
- separator
- sheet
- skeleton
- switch
- table
- tabs
- textarea
- toast
- (and more...)

### Recommended Additions

- layout-grid (from @aceternity)
- bento-grid (from @aceternity)
- animated-tooltip (from @aceternity)
- card-hover-effect (from @aceternity)

## Best Practices

1. **Component Discovery:**
   - Use shadcn MCP for registry browsing
   - Use context7 MCP for library documentation
   - Search multiple registries for best matches

2. **Component Integration:**
   - Always migrate to tailwind-variants
   - Maintain design system consistency
   - Add comprehensive JSDoc
   - Create Storybook stories

3. **Documentation:**
   - Keep component discovery report updated
   - Document integration decisions
   - Maintain component inventory

## References

- **Component Discovery Report:** `bmad/docs/component-discovery-report.md`
- **Design Guide:** `bmad/docs/design/design-guide.md`
- **Architecture:** `bmad/docs/architecture.md`
- **Storybook Config:** `.storybook/main.ts`
- **Components Config:** `components.json`

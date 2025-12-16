# Card Component Variants

## Overview

The Card component has been enhanced with multiple variants using `tailwind-variants` to provide flexible styling options for different use cases throughout the application.

## Variants

### `default`

Standard card with subtle border and shadow. Use for general content containers.

```tsx
<Card variant="default">
  <CardHeader>
    <CardTitle>Default Card</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### `elevated`

Card with enhanced shadow that increases on hover. Perfect for important metrics, summaries, and featured content.

```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Elevated Card</CardTitle>
  </CardHeader>
  <CardContent>Important content here</CardContent>
</Card>
```

**Use Cases:**

- Analytics dashboards
- Import summaries
- Validation summaries
- Player overview cards
- Tournament cards

### `outlined`

Card with a prominent 2px border and no shadow. Great for subtle containers and role cards.

```tsx
<Card variant="outlined">
  <CardHeader>
    <CardTitle>Outlined Card</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

**Use Cases:**

- Role information cards
- Filter panels
- Secondary information displays

### `ghost`

Transparent card with no border or shadow. Use when you need minimal visual weight.

```tsx
<Card variant="ghost">
  <CardHeader>
    <CardTitle>Ghost Card</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

**Use Cases:**

- Overlays
- Minimal UI sections
- Background content

### `interactive`

Card with hover effects including shadow increase and border color change. Perfect for clickable cards.

```tsx
<Card variant="interactive">
  <CardHeader>
    <CardTitle>Interactive Card</CardTitle>
  </CardHeader>
  <CardContent>Clickable content here</CardContent>
</Card>
```

**Use Cases:**

- Player cards with analytics links
- Club cards with view actions
- Any card that triggers navigation or actions

## Padding Variants

Control card padding with the `padding` prop:

- `none`: No padding (p-0)
- `sm`: Small padding (p-4)
- `default`: Standard padding (p-6) - default
- `lg`: Large padding (p-8)

```tsx
<Card variant="outlined" padding="sm">
  <CardContent>Compact content</CardContent>
</Card>
```

## Examples

### Analytics Dashboard

```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Player Overview</CardTitle>
  </CardHeader>
  <CardContent>{/* Metrics */}</CardContent>
</Card>
```

### Interactive Player Card

```tsx
<Card variant="interactive" onClick={handleViewAnalytics}>
  <CardHeader>
    <CardTitle>{player.name}</CardTitle>
  </CardHeader>
  <CardContent>{/* Player stats */}</CardContent>
</Card>
```

### Role Information

```tsx
<Card variant="outlined" padding="sm">
  <CardContent>
    <Badge>DON</Badge>
    <p>Role description</p>
  </CardContent>
</Card>
```

## Migration from Default Cards

When migrating existing cards, consider:

1. **Metrics/Statistics**: Use `elevated` for better visual hierarchy
2. **Clickable Cards**: Use `interactive` for better UX feedback
3. **Secondary Content**: Use `outlined` for subtle containers
4. **Minimal UI**: Use `ghost` when you need less visual weight

## Design System Alignment

These variants align with the design guide specifications:

- Role-based color system support
- Consistent spacing (4px base unit)
- Shadow system for depth
- Hover states for interactivity
- Dark mode compatibility

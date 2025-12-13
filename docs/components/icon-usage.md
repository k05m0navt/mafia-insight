# Icon Usage Guide

This document describes how to use icons consistently throughout the Mafia Insight platform using Lucide React icons.

## Overview

The platform uses **Lucide React** as the primary icon library, wrapped in a custom `Icon` component for consistent sizing and accessibility.

## Icon Component

### Basic Usage

```tsx
import { Icon } from '@/components/ui/icon';
import { User, Settings, Home } from 'lucide-react';

// Basic usage with size
<Icon icon={User} size="md" aria-label="User profile" />

// Small icon
<Icon icon={Settings} size="sm" aria-label="Settings" />

// Large icon
<Icon icon={Home} size="lg" aria-label="Home" />
```

### Icon Sizes

The `Icon` component supports five standard sizes:

- **xs**: 12px (h-3 w-3) - Extra small, for tight spaces
- **sm**: 16px (h-4 w-4) - Small, for buttons and compact UI
- **md**: 20px (h-5 w-5) - Medium, default size
- **lg**: 24px (h-6 w-6) - Large, for emphasis
- **xl**: 32px (h-8 w-8) - Extra large, for hero sections

### Accessibility

#### Required ARIA Labels

Icons that convey meaning must have an `aria-label`:

```tsx
// ✅ Good - icon has meaning
<Icon icon={User} aria-label="User profile" />

// ✅ Good - decorative icon
<Icon icon={Check} decorative />

// ❌ Bad - missing accessibility
<Icon icon={User} />
```

#### Decorative Icons

Icons that are purely decorative (don't convey information) should use the `decorative` prop:

```tsx
// Decorative checkmark in a list
<Icon icon={Check} decorative className="text-success" />
```

### Direct Lucide Usage

For cases where the `Icon` wrapper isn't needed, you can use Lucide icons directly:

```tsx
import { User } from 'lucide-react';

// Direct usage with consistent sizing
<User className="h-5 w-5" aria-label="User" />;
```

## Common Icon Patterns

### Navigation Icons

```tsx
import { Icon } from '@/components/ui/icon';
import { Home, Settings, User, BarChart3 } from 'lucide-react';

<nav>
  <Icon icon={Home} size="sm" aria-label="Home" />
  <Icon icon={BarChart3} size="sm" aria-label="Analytics" />
  <Icon icon={User} size="sm" aria-label="Profile" />
  <Icon icon={Settings} size="sm" aria-label="Settings" />
</nav>;
```

### Button Icons

```tsx
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Plus, Trash2, Edit } from 'lucide-react';

<Button>
  <Icon icon={Plus} size="sm" decorative />
  Add Item
</Button>

<Button variant="destructive">
  <Icon icon={Trash2} size="sm" decorative />
  Delete
</Button>
```

### Status Icons

```tsx
import { Icon } from '@/components/ui/icon';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

// Success
<Icon icon={CheckCircle} size="md" aria-label="Success" className="text-success" />

// Error
<Icon icon={XCircle} size="md" aria-label="Error" className="text-destructive" />

// Warning
<Icon icon={AlertCircle} size="md" aria-label="Warning" className="text-warning" />

// Info
<Icon icon={Info} size="md" aria-label="Information" className="text-info" />
```

### Data Visualization Icons

```tsx
import { Icon } from '@/components/ui/icon';
import { BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react';

<Icon icon={BarChart3} size="lg" aria-label="Bar chart" />
<Icon icon={LineChart} size="lg" aria-label="Line chart" />
<Icon icon={TrendingUp} size="lg" aria-label="Trending up" />
```

## Best Practices

1. **Always provide ARIA labels** for icons that convey meaning
2. **Use the `decorative` prop** for purely visual icons
3. **Consistent sizing** - use the `Icon` component's size prop rather than custom classes
4. **Match icon size to context** - smaller icons for buttons, larger for emphasis
5. **Use semantic colors** - leverage theme colors (text-primary, text-success, etc.)

## Icon Library

Browse available icons at: https://lucide.dev/icons/

Common icons used in the platform:

- Navigation: `Home`, `Settings`, `User`, `Menu`
- Actions: `Plus`, `Edit`, `Trash2`, `Save`, `Download`
- Status: `CheckCircle`, `XCircle`, `AlertCircle`, `Info`, `Loader2`
- Data: `BarChart3`, `LineChart`, `PieChart`, `TrendingUp`, `Database`
- Auth: `LogIn`, `LogOut`, `Shield`, `Lock`, `Unlock`

# Component Discovery Report - Analytics Dashboard Components

**Date**: 2025-01-27  
**Source**: Web Search, Context7, shadcn/ui Documentation

## Executive Summary

Research conducted using web search, Context7 documentation, and shadcn/ui resources has identified multiple component libraries and specific components that would enhance the Mafia Insight analytics dashboard. While the shadcn MCP registry is not currently accessible, alternative sources provided valuable insights.

## Recommended Component Libraries

### 1. shadcn/ui Core Components

**Source**: Context7 documentation (`/websites/ui_shadcn`)

#### Chart Components ⭐ Highly Recommended

- **Chart Container**: Base component for all chart types
- **Chart Tooltip**: Interactive tooltips for data points
- **Chart Legend**: Legend support for multi-series charts
- **Chart Types**: Bar, Line, Area, Pie charts via Recharts integration

**Use Cases for Mafia Insight:**

- Player performance trends over time
- Role-based win rate comparisons
- Tournament statistics visualization
- ELO rating progression charts

**Installation:**

```bash
npx shadcn@latest add chart
```

**Example Usage:**

```tsx
import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

<ChartContainer config={chartConfig}>
  <BarChart data={playerStats}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="month" />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="wins" fill="var(--color-primary)" />
  </BarChart>
</ChartContainer>;
```

#### HoverCard Components ⭐ Recommended

- **Hover Card Stats**: Displays metrics with detailed breakdown on hover
- **Financial Stats Pattern**: Shows income/expense breakdowns (adaptable for win/loss stats)

**Use Cases:**

- Quick metric previews with detailed breakdowns
- Player card hover states showing role performance
- Tournament card hover with game statistics

**Installation:**

```bash
npx shadcn@latest add hover-card
```

### 2. Magic UI Components

**Source**: Web search (magicui.design)

**Overview**: Open-source library with 150+ animated components built with React, TypeScript, Tailwind CSS, and Framer Motion. Designed to complement shadcn/ui.

**Key Features:**

- Animated components and effects
- Interactive data visualization elements
- Dynamic cards and UI elements
- Seamless shadcn/ui integration

**Recommended Components for Analytics:**

- Animated charts and graphs
- Interactive metric cards
- Dynamic data visualization elements
- Animated statistics displays

**Registry**: Available via shadcn registry as `@magicui`

**Installation:**

```bash
npx shadcn@latest add @magicui/<component-name>
```

### 3. Aceternity UI Components

**Source**: Web search (ui.aceternity.com)

**Overview**: Modern component library built with Tailwind CSS and Motion for React, offering unique and interactive components.

**Key Features:**

- Unique interactive components
- Motion-based animations
- Modern design patterns
- Available through shadcn registry

**Recommended Components:**

- Bento Grid layouts for dashboard organization
- Interactive card components
- Animated data displays

**Registry**: Available via shadcn registry as `@aceternity`

**Installation:**

```bash
npx shadcn@latest add @aceternity/bento-grid
npx shadcn@latest add @aceternity/<component-name>
```

## Specific Component Recommendations

### For Analytics Dashboards

#### 1. Stats Cards with Trend Indicators

**Source**: shadcn.io patterns

**Component**: React Stats Block Badges

- Features stats cards with trend badges
- Icons and header-aligned change indicators
- Perfect for analytics dashboards

**Use Case**: Player overview metrics, tournament statistics, club performance

#### 2. Navigation Menu with Stats

**Source**: shadcn.io patterns

**Component**: Dashboard-style Navigation Menu with Stats

- Data-rich navigation menu
- Live statistics with trend indicators
- Reports grid
- Dashboard-style analytics for quick metric access

**Use Case**: Main dashboard navigation with live metrics

#### 3. Account Usage & Analytics Dashboard

**Source**: shadcn.io blocks

**Component**: Usage Analytics Dashboard

- Activity metrics
- API usage charts (adaptable for game statistics)
- Bandwidth tracking (adaptable for data tracking)
- Feature usage breakdown
- Historical trend visualization

**Use Case**: Comprehensive analytics dashboard template

#### 4. Hover Card Stats Patterns

**Source**: shadcn.io patterns

**Components**:

- Simple Stats: Metric with icon and detailed breakdown by time period
- Financial Stats: Income/expense breakdowns (adaptable for win/loss)

**Use Case**:

- Player cards with hover details
- Tournament cards with game breakdowns
- Quick metric previews

## Implementation Priority

### High Priority (Immediate Value)

1. **Chart Components** - Essential for analytics visualization
2. **HoverCard Components** - Enhance existing card components
3. **Stats Cards with Trends** - Improve metric displays

### Medium Priority (Enhanced UX)

1. **Magic UI Animated Components** - Add polish to dashboard
2. **Aceternity Bento Grid** - Better dashboard layout organization
3. **Navigation Menu with Stats** - Enhanced navigation experience

### Low Priority (Nice to Have)

1. **Additional Magic UI Effects** - Visual enhancements
2. **Aceternity Interactive Components** - Advanced interactions

## Installation Guide

### Prerequisites

Ensure `components.json` is properly configured (already fixed in Phase 1):

```json
{
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json",
    "@magicui": "https://magicui.design/registry/{name}.json",
    "@aceternity": "https://ui.aceternity.com/registry/{name}.json"
  }
}
```

### Step-by-Step Installation

#### 1. Install Chart Components

```bash
# Install shadcn chart component
npx shadcn@latest add chart

# Install Recharts (if not already installed)
npm install recharts
```

#### 2. Install HoverCard

```bash
npx shadcn@latest add hover-card
```

#### 3. Install Magic UI Components (Example)

```bash
# Search for available components first
npx shadcn@latest view @magicui

# Install specific component
npx shadcn@latest add @magicui/animated-stats-card
```

#### 4. Install Aceternity Components (Example)

```bash
# Search for available components
npx shadcn@latest view @aceternity

# Install specific component
npx shadcn@latest add @aceternity/bento-grid
```

## Integration Examples

### Example 1: Player Performance Chart

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PlayerPerformanceChart({ data }: { data: PlayerStats[] }) {
  const chartConfig = {
    elo: { label: 'ELO Rating', color: '#2563eb' },
    wins: { label: 'Wins', color: '#10b981' },
  } satisfies ChartConfig;

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Performance Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="elo" stroke="var(--color-elo)" />
            <Line dataKey="wins" stroke="var(--color-wins)" />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

### Example 2: Stats Card with Hover Details

```tsx
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PlayerStatsCard({ player }: { player: Player }) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Card variant="interactive" className="cursor-pointer">
          <CardHeader>
            <CardTitle>{player.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{player.eloRating}</div>
            <p className="text-sm text-muted-foreground">ELO Rating</p>
          </CardContent>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Role Performance</h4>
          {player.roleStats.map((role) => (
            <div key={role.role} className="flex justify-between">
              <span>{role.role}</span>
              <span>{role.winRate}%</span>
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
```

## Registry Access Notes

### Current Status

- **shadcn MCP**: Registry URLs not accessible via MCP (configuration issue)
- **Web Search**: Successfully found component information
- **Context7**: Successfully retrieved shadcn/ui documentation
- **Direct CLI**: Components can be installed via shadcn CLI

### Workaround

Use the shadcn CLI directly to browse and install components:

```bash
# List available components from a registry
npx shadcn@latest view @magicui
npx shadcn@latest view @aceternity

# Search for components
npx shadcn@latest search <query>
```

## Next Steps

1. **Install Chart Components** (High Priority)
   - Add chart component to project
   - Create example player performance chart
   - Integrate with existing analytics pages

2. **Enhance Existing Cards** (High Priority)
   - Add HoverCard to PlayerCard, TournamentCard, ClubCard
   - Implement detailed breakdowns on hover

3. **Explore Magic UI** (Medium Priority)
   - Browse available components
   - Identify animated components that enhance UX
   - Install and test selected components

4. **Explore Aceternity UI** (Medium Priority)
   - Review Bento Grid for dashboard layout
   - Identify interactive components
   - Test integration with existing design system

## References

- **shadcn/ui Documentation**: https://ui.shadcn.com/docs/components
- **Magic UI**: https://magicui.design
- **Aceternity UI**: https://ui.aceternity.com
- **shadcn.io Patterns**: https://www.shadcn.io/patterns
- **Context7 shadcn/ui**: `/websites/ui_shadcn`

## Conclusion

While the shadcn MCP registry is not currently accessible, research through web search and Context7 has identified valuable components that would significantly enhance the Mafia Insight analytics dashboard. The Chart components from shadcn/ui are particularly valuable for data visualization, and Magic UI/Aceternity UI offer additional animated and interactive components that complement the existing design system.

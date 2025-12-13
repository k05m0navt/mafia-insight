# Mafia Insight UX Design Specification

_Created on 2025-01-27 by k05m0navt_  
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

**Mafia Insight** is a web-based analytics platform that transforms Mafia card game data into actionable insights. This UX Design Specification defines the user experience strategy, visual foundation, and interaction patterns that will create a delightful, empowering, and engaging experience for players, judges, and clubs.

**Core Value Proposition:**

- **Players**: Complete game history, role-based analytics, effortless comparison
- **Judges**: Unique judge analytics dashboard (killer feature)
- **Clubs**: Team-level analytics and performance insights

**Platform Priority:** Mobile browser first, PWA optional enhancement, desktop tertiary

**WOW Moment Goal:** Users see their analytics within 30 seconds of first use

---

## 1. Design System Foundation

### 1.1 Design System Choice

**System:** ShadCN/UI (New York style)

**Version:** Latest (maintained via copy-paste components)

**Rationale:**

- Already configured and integrated in the project
- Copy-paste components provide full customization control
- Built on Radix UI primitives ensuring accessibility (WCAG 2.1 Level AA)
- Excellent TypeScript support
- Mobile-responsive by default
- No runtime dependencies

**Additional Registries Configured:**

- **@magicui**: Animated components for WOW moments and smooth interactions
- **@blocks** & **@shadcnblocks**: Dashboard and analytics components
- **@reui** & **@smoothui**: Smooth animations and microinteractions
- **@shadcn-studio**: Theme customization tools
- **@tailark**: Landing page and marketing components
- **@aceternity**: Additional UI components

**Components Provided by System:**

- Base UI components (buttons, forms, modals, cards, tables)
- Accessibility built-in (keyboard navigation, screen reader support)
- Theming capabilities (CSS variables, customizable colors)
- Responsive patterns (mobile-first, breakpoint system)
- Icon library (Lucide React)

**Custom Components Needed:**

- Interactive timeline graph visualization
- Role-based analytics cards (Don, Mafia, Sheriff, Citizen)
- Judge analytics dashboard components
- Comparison features (player vs player, role vs role)
- Overall statistics public view
- Leaderboard components
- Achievement/badge displays

**Customization Needs:**

- Custom color theme aligned with brand personality
- Animated transitions for data updates
- Specialized chart components for game analytics
- Mobile-optimized navigation patterns

---

## 2. Core User Experience

### 2.1 Defining Experience

**The ONE Experience That Defines Mafia Insight:**

"Instantly see comprehensive statistics — both overall (all players) and personal — with effortless comparison capabilities."

**What Makes This Special:**

- **Public Overall Statistics**: Users can see community-wide stats before logging in (entry point, WOW moment)
- **Personal Analytics**: Complete game history, role-based performance, ELO trends
- **Effortless Comparison**: Compare players, roles, time periods without cognitive load
- **Judge Analytics**: Unique professional tracking for judges (killer feature)

**User Mental Model:**

- "I want to see how I compare to everyone"
- "I want to understand my performance across different roles"
- "I want to track my progress over time"
- "I want to see my complete game history"

### 2.2 Core Experience Principles

**Speed:**

- Instant access: Overall statistics visible immediately (public view)
- < 30 seconds to first insight (WOW moment)
- Fast navigation between overall stats, personal stats, and comparisons
- Real-time data updates without page refreshes
- Optimized for mobile browser performance

**Guidance:**

- Smart defaults: Show most relevant stats first
- Progressive disclosure: Summary → details → deep dive
- Contextual help: Tooltips and inline guidance for complex metrics
- Clear navigation: Always know where you are and how to get to related data
- Onboarding: Guide first-time users to key features

**Flexibility:**

- Multiple entry points: Overall stats, personal stats, judge analytics, club analytics
- Customizable views: Users can focus on what matters to them
- Comparison tools: Easy to compare players, roles, time periods
- Filter and drill-down: Start broad, narrow as needed
- Role-based views: Different default views for players, judges, clubs

**Feedback:**

- Celebratory: Highlight achievements, personal bests, milestones (micro-rewards)
- Informative: Clear visualizations with context
- Responsive: Immediate feedback on interactions
- Delightful: Micro-animations, smooth transitions, visual polish
- Narrative: Present data as stories (performance over time as arcs)

---

## 3. Visual Foundation

### 3.1 Color System

**Selected Theme: Competitive Data (Hybrid Theme #5)**

**Rationale:**
Combines the energetic, engaging feel of Competitive Edge with the professional, trustworthy aesthetic of Data Mastery. This hybrid theme balances gaming community energy with analytics platform professionalism, making it perfect for all user segments (players, judges, clubs).

**Color Palette Overview:**

**Primary Colors:**

- **Primary**: `#4f46e5` (Deep Indigo) - Main actions, key elements, primary buttons
- **Secondary**: `#06b6d4` (Cyan) - Supporting actions, data visualization, secondary buttons
- **Accent**: `#8b5cf6` (Purple) - Highlights, achievements, badges, micro-rewards
- **Dark**: `#0f172a` (Slate) - Text, backgrounds, navigation

**Semantic Colors:**

- **Success**: `#10b981` (Emerald) - Positive actions, success states, achievements
- **Warning**: `#f59e0b` (Amber) - Warnings, important notices
- **Error**: `#ef4444` (Red) - Errors, destructive actions
- **Info**: `#3b82f6` (Blue) - Informational messages, links

**Neutral Grayscale:**

- **Background**: `#ffffff` (White) - Primary background
- **Surface**: `#f8fafc` (Slate 50) - Card backgrounds, elevated surfaces
- **Border**: `#e2e8f0` (Slate 200) - Borders, dividers
- **Text Primary**: `#0f172a` (Slate 900) - Primary text
- **Text Secondary**: `#64748b` (Slate 500) - Secondary text, labels
- **Text Muted**: `#94a3b8` (Slate 400) - Placeholder text, hints

**Color Usage:**

- **Primary Actions**: Use Deep Indigo (#4f46e5) for primary CTAs, main navigation, key metrics
- **Data Visualization**: Use Cyan (#06b6d4) for charts, graphs, analytics displays
- **Highlights**: Use Purple (#8b5cf6) for achievements, badges, special features
- **Success States**: Use Emerald (#10b981) for positive feedback, completed actions
- **Interactive Elements**: Use primary colors with hover states (darker shades)

**Accessibility:**

- All text meets WCAG 2.1 Level AA contrast requirements (4.5:1 minimum)
- Interactive elements have clear focus indicators
- Color is never the sole indicator of information (icons, labels accompany colors)

**Interactive Visualizations:**

- Color Theme Explorer: [ux-color-themes.html](./ux-color-themes.html)

**Complete Color Token System:**
For comprehensive color tokens including light/dark theme variants, role-specific colors, and CSS variable definitions, see: [Design Tokens - Colors](./design-tokens.md#11-color-tokens)

### 3.2 Typography System

**Font Families:**

- **Heading Font**: System font stack (San Francisco on macOS, Segoe UI on Windows, Roboto on Android)
- **Body Font**: System font stack for optimal performance and native feel
- **Monospace Font**: `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace` (for code, data tables)

**Type Scale:**

- **H1**: 2.5rem (40px) - Page titles, hero sections
- **H2**: 2rem (32px) - Section headers, major headings
- **H3**: 1.5rem (24px) - Subsection headers, card titles
- **H4**: 1.25rem (20px) - Component titles, labels
- **H5**: 1.125rem (18px) - Small headings
- **H6**: 1rem (16px) - Smallest headings
- **Body**: 1rem (16px) - Primary body text
- **Small**: 0.875rem (14px) - Secondary text, captions
- **Tiny**: 0.75rem (12px) - Labels, metadata

**Font Weights:**

- **Bold (700)**: Headings, emphasis, important metrics
- **Semibold (600)**: Subheadings, button text, labels
- **Regular (400)**: Body text, descriptions
- **Medium (500)**: Subtle emphasis, secondary headings

**Line Heights:**

- **Headings**: 1.2 (tight, for visual hierarchy)
- **Body**: 1.6 (comfortable reading)
- **Small Text**: 1.5 (compact but readable)

**Letter Spacing:**

- **Headings**: -0.02em (slightly tighter for modern look)
- **Body**: 0 (normal)
- **Uppercase Labels**: 0.05em (for badges, tags)

**Complete Typography Token System:**
For comprehensive typography tokens including font families, sizes, weights, line heights, and letter spacing with CSS variable definitions, see: [Design Tokens - Typography](./design-tokens.md#22-typography-tokens)

### 3.3 Spacing and Layout Foundation

**Base Unit**: 4px (all spacing multiples of 4)

**Spacing Scale:**

- **xs**: 0.25rem (4px) - Tight spacing, icon padding
- **sm**: 0.5rem (8px) - Small gaps, compact layouts
- **md**: 1rem (16px) - Standard spacing, component padding
- **lg**: 1.5rem (24px) - Section spacing, card padding
- **xl**: 2rem (32px) - Large gaps, section margins
- **2xl**: 3rem (48px) - Major section separation
- **3xl**: 4rem (64px) - Page-level spacing

**Layout Grid:**

- **Mobile**: Single column, 16px padding
- **Tablet**: 2-column layout, 24px padding
- **Desktop**: 12-column grid, max-width 1400px, 32px padding

**Container Widths:**

- **Mobile**: Full width (100vw - 32px padding)
- **Tablet**: Max-width 768px
- **Desktop**: Max-width 1400px, centered

**Breakpoints:**

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

**Complete Spacing Token System:**
For comprehensive spacing tokens including base unit system, spacing scale, component-specific spacing, and CSS variable definitions, see: [Design Tokens - Spacing](./design-tokens.md#3-spacing-tokens)

---

## 4. Design Direction

**Selected Direction: Refined Professional (Direction #9)**

**Rationale:**
After exploring multiple design directions, Direction #9 was selected as it combines the best elements from various approaches:

- **Sidebar Navigation**: Icon-based sidebar without top navigation for cleaner layout
- **Professional Gradients**: Role-specific color gradients with visual depth
- **Interactive Feedback**: Hover effects on all interactive elements
- **Mobile-First**: Responsive design with bottom navigation for mobile
- **Dark Theme Support**: Full dark theme implementation
- **Filter Integration**: Collapsible filter panel for data refinement

**Key Characteristics:**

- **Layout**: Sidebar + Main Content (No Top Nav)
- **Density**: Balanced information density
- **Navigation**: Icon Sidebar + Breadcrumb
- **Best For**: All Users, All Devices

**Visual Mockups:**

- Interactive Design Mockups: [ux-design-directions.html](./ux-design-directions.html)
- Color Theme Explorer: [ux-color-themes.html](./ux-color-themes.html)

---

## 5. User Journey Flows

_This section will be completed during collaborative user journey design._

---

## 6. Component Library

### 6.1 Component Strategy

**From Design System (ShadCN/UI + Registries):**

- Buttons, forms, inputs, modals, dialogs
- Cards, tables, badges, avatars
- Navigation components
- Chart containers and wrappers
- Loading states, skeletons
- Toast notifications

**Custom Components Needed:**

1. **Interactive Timeline Graph**
   - Purpose: Visualize complete game history over time
   - States: Loading, empty, populated, filtered
   - Interactions: Hover for details, click to filter, brush selection
   - Mobile: Touch-optimized, responsive scaling

2. **Role-Based Analytics Cards**
   - Purpose: Display performance metrics for Don, Mafia, Sheriff, Citizen
   - Variants: Summary card, detailed card, comparison card
   - States: Default, hover, selected, loading

3. **Judge Analytics Dashboard**
   - Purpose: Tournament history, earnings, games judged statistics
   - Components: Tournament timeline, earnings chart, monthly statistics
   - States: Empty (no judge data), populated, loading

4. **Comparison Features**
   - Purpose: Compare players, roles, time periods
   - Components: Comparison selector, side-by-side views, difference indicators
   - States: No selection, single selection, comparison active

5. **Overall Statistics Public View**
   - Purpose: Entry point showing community-wide stats
   - Components: Leaderboard preview, trending players, recent activity
   - States: Public view, authenticated view (personalized)

6. **Achievement/Badge Displays**
   - Purpose: Micro-rewards and engagement (inspired by Strava)
   - Components: Badge cards, achievement timeline, weekly summaries
   - States: Locked, unlocked, highlighted

**Detailed Component Specifications:**
For complete component specifications including visual specs, states, interactions, and implementation guidelines, see: [Component Specifications](./component-specifications.md)

---

## 7. UX Pattern Decisions

### 7.1 Interaction Patterns

All interaction patterns, animations, transitions, and micro-interactions are documented in detail. These patterns ensure consistent, delightful, and accessible user experiences across the platform.

**Key Interaction Patterns:**

- **Hover Interactions**: Sidebar navigation, stat cards, role performance cards, buttons
- **Click/Tap Interactions**: Filter panel toggle, stat card selection
- **Loading States**: Skeleton loading, spinner animations
- **Transition Patterns**: Page transitions, content updates
- **Focus States**: Keyboard navigation indicators, skip links
- **Touch Interactions**: Mobile touch feedback, swipe gestures
- **Micro-Interactions**: Success feedback, error feedback, number count-up
- **Responsive Behavior**: Sidebar collapse, grid layout changes

**Detailed Interaction Patterns:**
For complete interaction pattern specifications including animations, transitions, accessibility considerations, and performance guidelines, see: [Interaction Patterns](./interaction-patterns.md)

### 7.2 Design Tokens

All design tokens (colors, typography, spacing, shadows, borders, gradients, animations) are defined in a comprehensive token system for consistency and easy theming.

**Token Categories:**

- **Colors**: Primary, semantic, neutral, role-specific (light & dark themes)
- **Typography**: Font families, sizes, weights, line heights, letter spacing
- **Spacing**: 4px base unit system with component-specific spacing
- **Borders**: Widths and radius values
- **Shadows**: Elevation levels and colored shadows
- **Gradients**: Background gradients for cards and buttons
- **Animations**: Duration, easing functions, transform values
- **Breakpoints**: Responsive breakpoint tokens

**Detailed Design Tokens:**
For complete design token specifications including CSS variables, Tailwind integration, and TypeScript usage, see: [Design Tokens](./design-tokens.md)

---

## 8. Responsive Design & Accessibility

### 8.1 Platform Priority

1. **Mobile Browser** (Primary)
   - Target: iOS Safari, Chrome Mobile, Samsung Internet
   - Optimizations: Touch targets (minimum 44px), thumb-friendly navigation, responsive layouts
   - Performance: Fast loading, optimized images, lazy loading

2. **PWA** (Optional Enhancement)
   - Offline access to previously loaded data
   - Installable to home screen
   - Native app-like experience

3. **Desktop** (Tertiary)
   - Larger screen real estate for detailed analytics
   - Multi-column layouts
   - Enhanced data visualization

### 8.2 Responsive Strategy

**Breakpoint System:**

- **Mobile**: 320px - 767px (single column, bottom navigation)
- **Tablet**: 768px - 1023px (2-column layouts, sidebar visible)
- **Desktop**: 1024px+ (full sidebar, multi-column grids, max-width 1400px)

**Layout Adaptations:**

- **Sidebar**: Visible on desktop/tablet, hidden on mobile (replaced by bottom nav)
- **Stat Grid**: 4 columns (desktop) → 2 columns (mobile)
- **Role Cards**: 4 columns (desktop) → horizontal scroll (mobile)
- **Filter Panel**: Collapsible on all devices
- **Content Padding**: 1.5rem (desktop) → 1rem (mobile)

**Complete Breakpoint Tokens:**
For comprehensive breakpoint tokens and responsive behavior patterns, see: [Design Tokens - Breakpoints](./design-tokens.md#9-breakpoint-tokens) and [Interaction Patterns - Responsive Behavior](./interaction-patterns.md#8-responsive-behavior)

### 8.3 Accessibility Strategy

**WCAG Compliance Target:** Level AA

**Key Requirements:**

- Color contrast: 4.5:1 for text, 3:1 for UI components
- Keyboard navigation: All interactive elements accessible
- Focus indicators: Visible focus states on all interactive elements
- ARIA labels: Meaningful labels for screen readers
- Alt text: Descriptive text for charts and visualizations
- Form labels: Proper label associations
- Error identification: Clear, descriptive error messages
- Touch target size: Minimum 44px for mobile

**Testing Strategy:**

- Automated: Lighthouse, axe DevTools
- Manual: Keyboard-only navigation testing
- Screen reader: VoiceOver (iOS), TalkBack (Android) testing

---

## 9. Implementation Guidance

### 9.1 Inspiration Sources Applied

**From Strava:**

- Narrative analytics: Present data as stories (judge history, role performance as arcs)
- Micro-rewards: Weekly summaries, badges, achievement highlights
- Effortless comparison: Leaderboards, personal bests, season comparisons

**From Discord:**

- Context-aware navigation: Organize clubs, sessions, players, tables
- Identity expression: Avatars, roles, badges, status markers
- Community feel: Familiar, living space, not sterile admin panel

**From Tableau/Looker Studio:**

- Progressive complexity: Start simple, enable deeper exploration
- Smart defaults: Powerful without heavy configuration
- Immersive visual patterns: Heatmaps, trendlines, segmentation

**From Chess.com:**

- Rich personal profiles: Data-powered player/judge profiles
- Pattern recognition: Help users understand their "style"
- Engagement loops: Daily/weekly challenges

### 9.2 Design Decisions Summary

**Emotional Foundation:**

- Primary: **Delighted** (drives sharing and word-of-mouth)
- Supporting: Empowered (in control), Competitive (comparing), Efficient (quick access)

**Most Critical Action:**

- See overall statistics quickly (public view) - Entry point and WOW moment

**Core Experience:**

- Instantly see comprehensive statistics with effortless comparison

**Platform:**

- Mobile browser first, PWA optional, desktop tertiary

---

## Appendix

### Related Documents

**Product Documentation:**

- Product Requirements: `bmad/docs/prd.md`
- Product Brief: `bmad/docs/product-brief-mafia-insight-2025-11-24.md`
- Brainstorming: `bmad/docs/bmm-brainstorming-session-2025-11-23.md`
- ShadCN Registry Analysis: `bmad/docs/shadcn-registry-analysis-2025-01-27.md`

**Design Documentation:**

- **Component Specifications**: `bmad/docs/component-specifications.md` - Detailed specs for all UI components
- **Design Tokens**: `bmad/docs/design-tokens.md` - Complete token system (colors, typography, spacing, etc.)
- **Interaction Patterns**: `bmad/docs/interaction-patterns.md` - All animations, transitions, and micro-interactions
- **Design Direction Mockups**: `bmad/docs/ux-design-directions.html` - Interactive design mockups
- **Color Theme Explorer**: `bmad/docs/ux-color-themes.html` - Interactive color theme visualization

### Next Steps

**Completed:**

- ✅ **Color Theme Exploration** - Competitive Data theme selected
- ✅ **Design Direction Mockups** - Refined Professional direction selected
- ✅ **Component Specifications** - Complete component specs documented
- ✅ **Design Tokens** - Comprehensive token system defined
- ✅ **Interaction Patterns** - All interaction patterns documented
- ✅ **Responsive Strategy** - Breakpoints and responsive behavior defined

**Remaining:**

1. **User Journey Design** - Define flows for critical user paths
2. **Implementation** - Begin building components using specifications
3. **Testing** - Validate accessibility and responsive behavior
4. **Refinement** - Iterate based on user feedback

---

_This UX Design Specification is a living document that will be completed through collaborative design facilitation._

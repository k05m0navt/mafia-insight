# Mafia Insight - Component Specifications

_Created on 2025-01-27_  
_Based on Refined Professional Design Direction (#9)_

---

## Overview

This document provides detailed specifications for all UI components used in the Mafia Insight platform. Components are organized by category and include visual specifications, states, interactions, and implementation guidelines.

---

## 1. Navigation Components

### 1.1 Sidebar Navigation

**Purpose:** Primary navigation for desktop view, providing access to all main sections.

**Visual Specifications:**

- **Width:** 240px (desktop)
- **Background (Light):** `#f8fafc`
- **Background (Dark):** `#1e293b`
- **Border:** 1px solid `#e2e8f0` (light) / `#334155` (dark)
- **Padding:** 1.5rem 1rem
- **Font:** System font stack
- **Border Radius:** 8px (for items)

**Structure:**

```
Sidebar
├── Brand Header
│   ├── Logo/Text: "Mafia Insight"
│   └── Color: #4f46e5 (primary)
├── Navigation Items
│   ├── Dashboard (active state)
│   ├── Analytics
│   ├── Timeline
│   ├── Compare
│   ├── Judge Stats
│   └── Settings
```

**Navigation Item States:**

**Default (Light):**

- Background: `transparent`
- Color: `#0f172a`
- Padding: `0.75rem`
- Border Radius: `8px`
- Transition: `all 0.2s`

**Hover (Light):**

- Background: `#f1f5f9`
- Transform: `translateX(4px)`

**Default (Dark):**

- Background: `transparent`
- Color: `#f8fafc`

**Hover (Dark):**

- Background: `#334155`
- Color: `#f8fafc`
- Transform: `translateX(4px)`

**Active State:**

- Background: `#e0e7ff` (light) / `rgba(79, 70, 229, 0.2)` (dark)
- Color: `#4f46e5` (light) / `#c7d2fe` (dark)
- Font Weight: `600`

**Icon Specifications:**

- Size: `1.25rem` (20px)
- Spacing: `0.75rem` gap between icon and text
- Alignment: Center aligned with text

**Accessibility:**

- Minimum touch target: 44px height
- Keyboard navigation support
- ARIA labels for screen readers
- Focus indicators visible

---

### 1.2 Bottom Navigation (Mobile)

**Purpose:** Primary navigation for mobile devices, providing thumb-friendly access.

**Visual Specifications:**

- **Height:** 64px
- **Background (Light):** `#ffffff`
- **Background (Dark):** `#0f172a`
- **Border Top:** 1px solid `#e2e8f0` (light) / `#334155` (dark)
- **Position:** Fixed bottom
- **Padding:** `0.5rem 0`

**Layout:**

- Grid: 5 columns (equal width)
- Icon size: `1.5rem` (24px)
- Text size: `0.75rem` (12px)
- Spacing: Icon and text vertically stacked

**States:**

- **Default:** Icon color `#64748b` (light) / `#94a3b8` (dark)
- **Active:** Icon color `#4f46e5` (light) / `#6366f1` (dark), text weight `600`
- **Hover:** Background `#f8fafc` (light) / `#1e293b` (dark)

---

### 1.3 Breadcrumb Navigation

**Purpose:** Show current location and enable navigation to parent pages.

**Visual Specifications:**

- **Font Size:** `0.875rem` (14px)
- **Color:** `#64748b` (light) / `#94a3b8` (dark)
- **Spacing:** `0.5rem` gap between items
- **Separator:** `/` character

**Link States:**

- **Default:** Color `#4f46e5` (light) / `#6366f1` (dark)
- **Hover:** Text decoration `underline`
- **Current:** Color `#0f172a` (light) / `#f8fafc` (dark), font weight `600`

---

## 2. Stat Cards

### 2.1 Stat Card (Overview)

**Purpose:** Display key metrics with icons, values, and trend indicators.

**Visual Specifications:**

- **Layout:** Grid of 4 columns (desktop), 2 columns (mobile)
- **Background (Light):** `linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)`
- **Background (Dark):** `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`
- **Border:** 2px solid `#e2e8f0` (light) / `#334155` (dark)
- **Border Radius:** `12px`
- **Padding:** `1.5rem`
- **Box Shadow:** `0 2px 4px rgba(0,0,0,0.05)` (light) / `0 2px 4px rgba(0,0,0,0.1)` (dark)
- **Position:** `relative` (for checkbox overlay)

**Structure:**

```
Stat Card
├── Checkbox (top-right, appears on hover)
├── Icon + Label Row
│   ├── Icon (emoji, 1.5rem)
│   └── Label (uppercase, 0.75rem, #64748b)
├── Value (2.5rem, bold, #0f172a)
└── Trend Indicator (0.75rem, #10b981)
```

**Hover States:**

- **Transform:** `translateY(-2px)`
- **Border Color:** `#4f46e5` (light) / `#6366f1` (dark)
- **Box Shadow:** `0 8px 24px rgba(79, 70, 229, 0.2)` (light) / `0 8px 24px rgba(99, 102, 241, 0.3)` (dark)
- **Checkbox:** Displayed (top-right corner)

**Text Specifications:**

- **Label:** `0.75rem`, uppercase, `#64748b` (light) / `#94a3b8` (dark), weight `600`
- **Value:** `2.5rem`, weight `700`, `#0f172a` (light) / `#f8fafc` (dark), line-height `1`
- **Trend:** `0.75rem`, `#10b981`, weight `600`

**Accessibility:**

- Checkbox for export selection
- Keyboard accessible
- Screen reader labels

---

### 2.2 Role Performance Cards

**Purpose:** Display role-specific statistics with unique color coding and visual depth.

**Visual Specifications:**

- **Layout:** Grid of 4 columns (desktop), horizontal scroll (mobile)
- **Padding:** `2rem 1.5rem`
- **Border Radius:** `16px`
- **Position:** `relative` (for decorative elements)
- **Overflow:** `hidden`
- **Cursor:** `pointer`
- **Transition:** `all 0.3s ease`

**Role Color Schemes:**

**Don:**

- Background: `linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)`
- Shadow: `0 4px 12px rgba(79, 70, 229, 0.3)`
- Hover Shadow: `0 8px 24px rgba(79, 70, 229, 0.5)`

**Mafia:**

- Background: `linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)`
- Shadow: `0 4px 12px rgba(6, 182, 212, 0.3)`
- Hover Shadow: `0 8px 24px rgba(6, 182, 212, 0.5)`

**Sheriff:**

- Background: `linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)`
- Shadow: `0 4px 12px rgba(139, 92, 246, 0.3)`
- Hover Shadow: `0 8px 24px rgba(139, 92, 246, 0.5)`

**Citizen:**

- Background: `linear-gradient(135deg, #10b981 0%, #14b8a6 100%)`
- Shadow: `0 4px 12px rgba(16, 185, 129, 0.3)`
- Hover Shadow: `0 8px 24px rgba(16, 185, 129, 0.5)`

**Structure:**

```
Role Card
├── Decorative Circle (top-right, rgba(255,255,255,0.1))
├── Role Icon (2rem emoji)
├── Role Name (1rem, opacity 0.95, weight 600)
├── Win Rate (2.5rem, weight 700, line-height 1)
├── Badge ("Win Rate", 0.75rem, rgba(255,255,255,0.2))
└── Game Count (0.7rem, opacity 0.8)
```

**Hover States:**

- **Transform:** `translateY(-4px) scale(1.02)`
- **Box Shadow:** Enhanced (see role-specific shadows above)

**Text Specifications:**

- All text: `white` color
- Role Name: `1rem`, opacity `0.95`, weight `600`
- Win Rate: `2.5rem`, weight `700`, line-height `1`
- Badge: `0.75rem`, opacity `0.85`, padding `0.25rem 0.75rem`, background `rgba(255,255,255,0.2)`
- Game Count: `0.7rem`, opacity `0.8`

---

## 3. Filter Components

### 3.1 Filter Panel

**Purpose:** Collapsible panel for filtering analytics data.

**Visual Specifications:**

- **Background (Light):** `#f8fafc`
- **Background (Dark):** `#1e293b`
- **Border:** 1px solid `#e2e8f0` (light) / `#334155` (dark)
- **Border Radius:** `12px`
- **Padding:** `1.5rem`
- **Display:** `none` by default, toggled via button

**Structure:**

```
Filter Panel
├── Header
│   ├── Title (🔍 Filter Analytics)
│   └── Close Button (×)
├── Filter Grid (4 columns desktop, 1 column mobile)
│   ├── Date Range Select
│   ├── Role Select
│   ├── Game Outcome Select
│   └── Tournament Select
└── Actions
    ├── Clear Button
    └── Apply Filters Button
```

**Filter Select Specifications:**

- **Width:** `100%`
- **Padding:** `0.5rem`
- **Border:** 1px solid `#e2e8f0` (light) / `#334155` (dark)
- **Border Radius:** `6px`
- **Background (Light):** `white`
- **Background (Dark):** `#0f172a`
- **Color (Light):** `#0f172a`
- **Color (Dark):** `#f8fafc`

**Label Specifications:**

- **Font Size:** `0.875rem` (14px)
- **Font Weight:** `600`
- **Color (Light):** `#475569`
- **Color (Dark):** `#cbd5e1`
- **Margin Bottom:** `0.5rem`

**Button Specifications:**

**Clear Button:**

- Background (Light): `#f8fafc`
- Background (Dark): `#334155`
- Border: 1px solid `#e2e8f0` (light) / `#475569` (dark)
- Color (Light): `#64748b`
- Color (Dark): `#cbd5e1`
- Padding: `0.5rem 1.5rem`
- Border Radius: `6px`

**Apply Filters Button:**

- Background: `linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)`
- Color: `white`
- Border: `none`
- Padding: `0.5rem 1.5rem`
- Border Radius: `6px`
- Box Shadow: `0 2px 8px rgba(79, 70, 229, 0.2)`

---

### 3.2 Filter Button

**Purpose:** Toggle filter panel visibility.

**Visual Specifications:**

- **Background (Light):** `#f8fafc`
- **Background (Dark):** `#1e293b`
- **Border:** 1px solid `#e2e8f0` (light) / `#334155` (dark)
- **Border Radius:** `8px`
- **Padding:** `0.5rem 1rem`
- **Color (Light):** `#64748b`
- **Color (Dark):** `#94a3b8`
- **Font Weight:** `600`
- **Display:** `flex`, align-items `center`, gap `0.5rem`

**Hover States:**

- **Background (Light):** `#e2e8f0`
- **Background (Dark):** `#334155`
- **Border Color (Light):** `#4f46e5`
- **Border Color (Dark):** `#6366f1`
- **Color (Light):** `#4f46e5`
- **Color (Dark):** `#c7d2fe`

---

## 4. Content Cards

### 4.1 Content Card (Generic)

**Purpose:** Container for grouped content sections.

**Visual Specifications:**

- **Background (Light):** `white`
- **Background (Dark):** `#1e293b`
- **Border:** 1px solid `#e2e8f0` (light) / `#334155` (dark)
- **Border Radius:** `12px`
- **Padding:** `1.5rem`
- **Margin Bottom:** `1.5rem`
- **Box Shadow:** `0 2px 8px rgba(0,0,0,0.05)` (light) / `0 2px 8px rgba(0,0,0,0.1)` (dark)

**Header Specifications:**

- **Font Size:** `1.25rem` (20px)
- **Font Weight:** `700`
- **Color (Light):** `#0f172a`
- **Color (Dark):** `#f8fafc`
- **Margin Bottom:** `1.5rem`
- **Display:** `flex`, align-items `center`, gap `0.5rem`
- **Icon Size:** `1.5rem` (24px)

---

## 5. Button Components

### 5.1 Primary Action Button

**Purpose:** Main call-to-action buttons.

**Visual Specifications:**

- **Background:** `linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)`
- **Color:** `white`
- **Border:** `none`
- **Border Radius:** `12px`
- **Padding:** `1.5rem`
- **Font Weight:** `700`
- **Box Shadow:** `0 4px 12px rgba(79, 70, 229, 0.2)`
- **Text Align:** `left`
- **Display:** `flex`, align-items `center`, gap `0.75rem`

**Hover States:**

- **Box Shadow:** `0 8px 24px rgba(79, 70, 229, 0.3)` (light) / `0 8px 24px rgba(99, 102, 241, 0.4)` (dark)
- **Transform:** `translateY(-2px)`

**Structure:**

```
Primary Button
├── Icon (1.75rem)
├── Title (1.125rem, weight 700)
└── Description (0.875rem, opacity 0.9)
```

---

## 6. Mobile-Specific Components

### 6.1 Mobile Header

**Purpose:** Top navigation bar for mobile devices.

**Visual Specifications:**

- **Height:** 64px
- **Background (Light):** `white`
- **Background (Dark):** `#0f172a`
- **Border Bottom:** 1px solid `#e2e8f0` (light) / `#334155` (dark)
- **Padding:** `1rem`
- **Display:** `flex`, justify-content `space-between`, align-items `center`

**Elements:**

- **Title:** Font size `1.125rem`, weight `700`
- **Filter Icon Button:** Same as filter button specifications

---

### 6.2 Mobile Stat Grid

**Purpose:** Responsive stat cards for mobile.

**Visual Specifications:**

- **Grid:** 2 columns
- **Gap:** `0.75rem`
- **Padding:** `1rem` (reduced from desktop)

**Card Adjustments:**

- **Padding:** `1rem` (reduced from `1.5rem`)
- **Icon Size:** `1.25rem` (reduced from `1.5rem`)
- **Value Size:** `2rem` (reduced from `2.5rem`)

---

### 6.3 Mobile Role Cards

**Purpose:** Horizontal scrolling role performance cards.

**Visual Specifications:**

- **Display:** `flex`, `overflow-x: auto`
- **Gap:** `0.75rem`
- **Padding Bottom:** `0.5rem` (for scrollbar)

**Card Specifications:**

- **Min Width:** `160px`
- **Padding:** `1.5rem 1.25rem`
- **Icon Size:** `1.75rem` (reduced from `2rem`)
- **Win Rate Size:** `2rem` (reduced from `2.5rem`)

---

## 7. Dark Theme Adaptations

All components support dark theme with the following color mappings:

**Background Mappings:**

- `#ffffff` → `#0f172a` (main background)
- `#f8fafc` → `#1e293b` (surface/card background)
- `white` → `#1e293b` (card background)

**Text Mappings:**

- `#0f172a` → `#f8fafc` (primary text)
- `#64748b` → `#94a3b8` (secondary text)
- `#475569` → `#cbd5e1` (labels)

**Border Mappings:**

- `#e2e8f0` → `#334155` (borders)

**Shadow Adjustments:**

- Light theme shadows use `rgba(0,0,0,0.05)` to `rgba(0,0,0,0.1)`
- Dark theme shadows use `rgba(0,0,0,0.1)` to `rgba(0,0,0,0.2)`
- Colored shadows maintain same opacity but adjust for dark backgrounds

---

## 8. Accessibility Requirements

### 8.1 Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order follows visual hierarchy
- Enter/Space activates buttons and links
- Escape closes modals and panels

### 8.2 Screen Readers

- All icons have ARIA labels or text alternatives
- Form inputs have associated labels
- Status changes are announced
- Navigation landmarks are properly marked

### 8.3 Focus Indicators

- Visible focus outline on all interactive elements
- Focus color: `#4f46e5` (light) / `#6366f1` (dark)
- Focus ring: 2px solid, offset by 2px

### 8.4 Touch Targets

- Minimum size: 44px × 44px
- Adequate spacing between targets (minimum 8px)
- Mobile-optimized tap areas

### 8.5 Color Contrast

- Text meets WCAG AA (4.5:1 minimum)
- UI components meet WCAG AA (3:1 minimum)
- Color is never the sole indicator (icons, labels accompany)

---

## 9. Responsive Breakpoints

**Mobile:** 320px - 767px

- Single column layouts
- Bottom navigation
- Collapsible sidebar
- Reduced padding and font sizes

**Tablet:** 768px - 1023px

- 2-column grids where appropriate
- Sidebar remains visible
- Increased padding

**Desktop:** 1024px+

- Full 4-column stat grids
- Sidebar always visible
- Maximum content width: 1400px
- Full padding and spacing

---

## 10. Implementation Notes

### 10.1 CSS Variables

All colors should be defined as CSS variables for easy theme switching:

```css
--color-primary: #4f46e5;
--color-secondary: #06b6d4;
--color-background: #ffffff;
--color-text-primary: #0f172a;
/* etc. */
```

### 10.2 Component Structure

- Use semantic HTML elements
- Implement proper ARIA attributes
- Support both light and dark themes
- Ensure responsive behavior

### 10.3 Animation Performance

- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Keep transition durations: 0.2s - 0.3s
- Use `will-change` sparingly

### 10.4 State Management

- Document all component states (default, hover, active, disabled, loading, error)
- Ensure state transitions are smooth
- Provide visual feedback for all interactions

---

_This specification is a living document and should be updated as components evolve._

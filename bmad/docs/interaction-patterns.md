# Mafia Insight - Interaction Patterns

_Created on 2025-01-27_  
_Based on Refined Professional Design Direction (#9)_

---

## Overview

This document defines all interaction patterns, animations, transitions, and micro-interactions used throughout the Mafia Insight platform. These patterns ensure consistent, delightful, and accessible user experiences.

---

## 1. Hover Interactions

### 1.1 Sidebar Navigation Items

**Trigger:** Mouse hover over navigation item

**Light Theme:**

- **Background:** `transparent` → `#f1f5f9`
- **Transform:** `translateX(0)` → `translateX(4px)`
- **Duration:** `0.2s`
- **Easing:** `ease-out`

**Dark Theme:**

- **Background:** `transparent` → `#334155`
- **Color:** `#f8fafc` (maintains)
- **Transform:** `translateX(0)` → `translateX(4px)`
- **Duration:** `0.2s`
- **Easing:** `ease-out`

**Implementation:**

```css
.sidebar-item {
  transition: all 0.2s ease-out;
}

.sidebar-item:hover {
  background: var(--color-surface-hover);
  transform: translateX(4px);
}
```

**Accessibility:**

- Works with keyboard focus (`:focus` state)
- Maintains transform on focus for keyboard users
- No hover-only functionality

---

### 1.2 Stat Cards

**Trigger:** Mouse hover over stat card

**Light Theme:**

- **Border Color:** `#e2e8f0` → `#4f46e5`
- **Box Shadow:** `0 2px 4px rgba(0,0,0,0.05)` → `0 8px 24px rgba(79, 70, 229, 0.2)`
- **Transform:** `translateY(0)` → `translateY(-2px)`
- **Checkbox:** `display: none` → `display: block` (top-right corner)
- **Duration:** `0.2s`
- **Easing:** `ease-out`

**Dark Theme:**

- **Border Color:** `#334155` → `#6366f1`
- **Box Shadow:** `0 2px 4px rgba(0,0,0,0.1)` → `0 8px 24px rgba(99, 102, 241, 0.3)`
- **Transform:** `translateY(0)` → `translateY(-2px)`
- **Checkbox:** `display: none` → `display: block`
- **Duration:** `0.2s`
- **Easing:** `ease-out`

**Implementation:**

```css
.stat-card {
  transition: all 0.2s ease-out;
  position: relative;
}

.stat-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-primary-lg);
  transform: translateY(-2px);
}

.stat-card:hover .check-icon {
  display: block;
}
```

**Accessibility:**

- Checkbox is keyboard accessible
- Focus state matches hover state
- Screen reader announces checkbox appearance

---

### 1.3 Role Performance Cards

**Trigger:** Mouse hover over role performance card

**All Themes:**

- **Transform:** `translateY(0) scale(1)` → `translateY(-4px) scale(1.02)`
- **Box Shadow:** Base shadow → Enhanced shadow (role-specific)
- **Duration:** `0.3s`
- **Easing:** `ease`

**Role-Specific Shadow Enhancements:**

**Don:**

- Base: `0 4px 12px rgba(79, 70, 229, 0.3)`
- Hover: `0 8px 24px rgba(79, 70, 229, 0.5)`

**Mafia:**

- Base: `0 4px 12px rgba(6, 182, 212, 0.3)`
- Hover: `0 8px 24px rgba(6, 182, 212, 0.5)`

**Sheriff:**

- Base: `0 4px 12px rgba(139, 92, 246, 0.3)`
- Hover: `0 8px 24px rgba(139, 92, 246, 0.5)`

**Citizen:**

- Base: `0 4px 12px rgba(16, 185, 129, 0.3)`
- Hover: `0 8px 24px rgba(16, 185, 129, 0.5)`

**Implementation:**

```css
.role-performance-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.role-performance-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-role-hover);
}
```

**Accessibility:**

- Cards are keyboard accessible
- Focus state includes same transform
- Click/tap area is sufficient (minimum 44px)

---

### 1.4 Filter Button

**Trigger:** Mouse hover over filter button

**Light Theme:**

- **Background:** `#f8fafc` → `#e2e8f0`
- **Border Color:** `#e2e8f0` → `#4f46e5`
- **Color:** `#64748b` → `#4f46e5`
- **Duration:** `0.2s`
- **Easing:** `ease-out`

**Dark Theme:**

- **Background:** `#1e293b` → `#334155`
- **Border Color:** `#334155` → `#6366f1`
- **Color:** `#94a3b8` → `#c7d2fe`
- **Duration:** `0.2s`
- **Easing:** `ease-out`

**Implementation:**

```css
.filter-button {
  transition: all 0.2s ease-out;
}

.filter-button:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
```

---

### 1.5 Primary Action Buttons

**Trigger:** Mouse hover over primary button

**All Themes:**

- **Box Shadow:** `0 4px 12px rgba(79, 70, 229, 0.2)` → `0 8px 24px rgba(79, 70, 229, 0.3)`
- **Transform:** `translateY(0)` → `translateY(-2px)`
- **Duration:** `0.2s`
- **Easing:** `ease-out`

**Dark Theme Adjustment:**

- Hover shadow: `0 8px 24px rgba(99, 102, 241, 0.4)`

**Implementation:**

```css
.btn-primary {
  transition: all 0.2s ease-out;
}

.btn-primary:hover {
  box-shadow: var(--shadow-primary-lg);
  transform: translateY(-2px);
}
```

---

### 1.6 Breadcrumb Links

**Trigger:** Mouse hover over breadcrumb link

**All Themes:**

- **Text Decoration:** `none` → `underline`
- **Duration:** `0.15s`
- **Easing:** `ease-out`

**Implementation:**

```css
.breadcrumb-link {
  transition: text-decoration 0.15s ease-out;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}
```

---

## 2. Click/Tap Interactions

### 2.1 Filter Panel Toggle

**Trigger:** Click/tap on filter button

**Animation:**

- Panel slides down with fade-in
- **Duration:** `0.3s`
- **Easing:** `ease-out`
- **Properties:** `opacity`, `transform`, `max-height`

**Implementation:**

```css
.filters-panel {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
  overflow: hidden;
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out,
    max-height 0.3s ease-out;
}

.filters-panel.open {
  opacity: 1;
  transform: translateY(0);
  max-height: 500px;
  display: block;
}
```

**Accessibility:**

- Keyboard accessible (Enter/Space activates)
- Focus management when panel opens
- Escape key closes panel
- ARIA expanded state

---

### 2.2 Stat Card Selection

**Trigger:** Click/tap on stat card checkbox

**Animation:**

- Checkbox fades in on hover (see hover interactions)
- Checkbox animates on selection
- **Duration:** `0.15s`
- **Easing:** `ease-out`
- **Properties:** `scale`, `opacity`

**Implementation:**

```css
.stat-card-checkbox {
  opacity: 0;
  transform: scale(0.8);
  transition:
    opacity 0.15s ease-out,
    transform 0.15s ease-out;
}

.stat-card:hover .stat-card-checkbox {
  opacity: 1;
  transform: scale(1);
}

.stat-card-checkbox:checked {
  /* Checked state styling */
}
```

---

## 3. Loading States

### 3.1 Skeleton Loading

**Purpose:** Show content structure while data loads

**Animation:**

- Shimmer effect across skeleton elements
- **Duration:** `1.5s`
- **Easing:** `linear`
- **Iteration:** `infinite`
- **Direction:** `alternate`

**Implementation:**

```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-surface-hover) 50%,
    var(--color-surface) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 1.5s linear infinite;
}
```

---

### 3.2 Spinner Loading

**Purpose:** Indicate processing/loading state

**Animation:**

- Rotating spinner
- **Duration:** `1s`
- **Easing:** `linear`
- **Iteration:** `infinite`

**Implementation:**

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

---

## 4. Transition Patterns

### 4.1 Page Transitions

**Purpose:** Smooth navigation between pages

**Animation:**

- Fade out current page
- Fade in new page
- **Duration:** `0.2s`
- **Easing:** `ease-in-out`

**Implementation:**

```css
.page-transition-enter {
  opacity: 0;
}

.page-transition-enter-active {
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
}

.page-transition-exit {
  opacity: 1;
}

.page-transition-exit-active {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}
```

---

### 4.2 Content Updates

**Purpose:** Smooth updates when data changes

**Animation:**

- Fade and slight scale
- **Duration:** `0.3s`
- **Easing:** `ease-out`

**Implementation:**

```css
.content-update {
  animation: contentUpdate 0.3s ease-out;
}

@keyframes contentUpdate {
  0% {
    opacity: 0.5;
    transform: scale(0.98);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## 5. Focus States

### 5.1 Interactive Elements

**Purpose:** Clear keyboard navigation indicators

**Visual:**

- **Outline:** 2px solid `#4f46e5` (light) / `#6366f1` (dark)
- **Offset:** 2px from element
- **Border Radius:** Matches element radius

**Implementation:**

```css
.interactive-element:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.interactive-element:focus:not(:focus-visible) {
  outline: none; /* Remove outline for mouse users */
}

.interactive-element:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

### 5.2 Skip Links

**Purpose:** Allow keyboard users to skip navigation

**Visual:**

- Hidden by default
- Visible on focus
- Positioned at top of page
- High contrast background

**Implementation:**

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  padding: 0.5rem 1rem;
  z-index: var(--z-tooltip);
}

.skip-link:focus {
  top: 0;
}
```

---

## 6. Touch Interactions (Mobile)

### 6.1 Touch Feedback

**Purpose:** Provide visual feedback on touch

**Animation:**

- Ripple effect or background color change
- **Duration:** `0.2s`
- **Easing:** `ease-out`

**Implementation:**

```css
.touch-target {
  -webkit-tap-highlight-color: rgba(79, 70, 229, 0.1);
  transition: background-color 0.2s ease-out;
}

.touch-target:active {
  background-color: var(--color-surface-hover);
}
```

---

### 6.2 Swipe Gestures

**Purpose:** Enable swipe actions on mobile

**Visual Feedback:**

- Element moves with finger
- Opacity changes based on swipe distance
- Snap back or complete based on threshold

**Implementation:**

```css
.swipeable {
  touch-action: pan-x;
  transition: transform 0.3s ease-out;
}

.swipeable.swiping {
  transition: none;
}
```

---

## 7. Micro-Interactions

### 7.1 Success Feedback

**Purpose:** Confirm successful actions

**Animation:**

- Checkmark appears with scale animation
- **Duration:** `0.3s`
- **Easing:** `ease-out` (bounce effect)

**Implementation:**

```css
@keyframes checkmark {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-checkmark {
  animation: checkmark 0.3s ease-out;
}
```

---

### 7.2 Error Feedback

**Purpose:** Indicate errors or failures

**Animation:**

- Shake animation
- **Duration:** `0.5s`
- **Easing:** `ease-in-out`

**Implementation:**

```css
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

.error-shake {
  animation: shake 0.5s ease-in-out;
}
```

---

### 7.3 Number Count-Up

**Purpose:** Animate number changes (statistics)

**Animation:**

- Count from 0 to target value
- **Duration:** `1s`
- **Easing:** `ease-out`

**Implementation:**

```javascript
function animateValue(element, start, end, duration) {
  const range = end - start;
  const increment = range / (duration / 16); // 60fps
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (
      (increment > 0 && current >= end) ||
      (increment < 0 && current <= end)
    ) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
}
```

---

## 8. Responsive Behavior

### 8.1 Sidebar Collapse (Mobile)

**Trigger:** Screen width < 768px

**Animation:**

- Sidebar slides out of view
- Bottom navigation appears
- **Duration:** `0.3s`
- **Easing:** `ease-in-out`
- **Properties:** `transform`, `opacity`

**Implementation:**

```css
@media (max-width: 767px) {
  .sidebar {
    transform: translateX(-100%);
    opacity: 0;
    transition:
      transform 0.3s ease-in-out,
      opacity 0.3s ease-in-out;
  }

  .bottom-nav {
    transform: translateY(0);
    opacity: 1;
    transition:
      transform 0.3s ease-in-out,
      opacity 0.3s ease-in-out;
  }
}
```

---

### 8.2 Grid Layout Changes

**Trigger:** Screen width changes

**Animation:**

- Grid columns adjust smoothly
- **Duration:** `0.3s`
- **Easing:** `ease-out`

**Implementation:**

```css
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  transition: grid-template-columns 0.3s ease-out;
}

@media (max-width: 767px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## 9. Accessibility Considerations

### 9.1 Reduced Motion

**Purpose:** Respect user's motion preferences

**Implementation:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 9.2 High Contrast Mode

**Purpose:** Support Windows High Contrast Mode

**Implementation:**

```css
@media (prefers-contrast: high) {
  .interactive-element {
    border: 2px solid;
  }

  .interactive-element:focus {
    outline: 3px solid;
  }
}
```

---

## 10. Performance Guidelines

### 10.1 GPU Acceleration

**Best Practices:**

- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly and remove after animation

**Example:**

```css
.animated-element {
  transform: translateZ(0); /* Force GPU acceleration */
  will-change: transform; /* Hint to browser */
}

.animated-element.animating {
  transform: translateY(-2px);
}
```

---

### 10.2 Animation Performance

**Targets:**

- Maintain 60fps (16.67ms per frame)
- Keep animations under 300ms for micro-interactions
- Use `requestAnimationFrame` for JavaScript animations
- Debounce scroll/resize handlers

---

## 11. Interaction Pattern Checklist

When implementing new interactions, ensure:

- [ ] Hover states work in both light and dark themes
- [ ] Focus states are clearly visible
- [ ] Touch targets are minimum 44px × 44px
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Keyboard navigation is fully supported
- [ ] Screen reader announcements are appropriate
- [ ] Performance targets are met (60fps)
- [ ] Mobile touch feedback is provided
- [ ] Loading states are implemented
- [ ] Error states have clear feedback

---

_These interaction patterns ensure a consistent, delightful, and accessible user experience across all devices and user preferences._

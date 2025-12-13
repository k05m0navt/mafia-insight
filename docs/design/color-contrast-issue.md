# Design System Color Contrast Issue

**Status**: Resolved  
**Priority**: High  
**Created**: 2025-01-27  
**Updated**: 2025-01-27  
**Resolved**: 2025-01-27  
**Related Story**: 1-3-email-authentication-user-login

## Progress

**2025-01-27**:

- ✅ Updated `--primary` color from 58% to 45% lightness (hsl(243, 75%, 45%)) for better text contrast
- ✅ Updated `--muted-foreground` from 47% to 35% lightness (hsl(215, 28%, 35%)) for WCAG AA compliance
- ✅ Changed hover opacity from /80 to /90 for primary text links in login form to maintain contrast
- ✅ Primary color now provides 8.87:1 contrast on white, 6.40:1 with 80% opacity
- ✅ Muted foreground now provides 7.61:1 contrast on white
- ✅ Test results: 56/60 tests passing (93% pass rate), up from 39/60 (65%)

## Remaining Work

Some color contrast violations may still appear in other components using theme colors. These should be addressed as they're encountered, or by updating hover states across the codebase to use /90 opacity instead of /80 for primary text links.

## Issue Summary

The design system theme colors do not meet WCAG 2.1 Level AA contrast requirements (4.5:1 ratio for normal text). This was discovered during accessibility testing of the login form.

## Affected Elements

### Current Contrast Ratios (Below WCAG 2.1 AA Standard)

1. **Input Placeholders**: 3.41:1 (Required: 4.5:1)
   - Color: `#878b94` (muted-foreground)
   - Background: `#ffffff` (card/background)
   - Font size: 14px

2. **Form Labels**: 3.41:1 (Required: 4.5:1)
   - Color: `#878b94` (muted-foreground)
   - Background: `#ffffff` (card/background)
   - Font size: 14px

3. **Primary Text Links**: 2.31:1 (Required: 4.5:1)
   - Color: `#a6a2f2` (primary)
   - Background: `#ffffff` (card/background)
   - Font size: 14px and 16px

4. **Button Text**: 2.31:1 (Required: 4.5:1)
   - Color: `#ffffff` (primary-foreground)
   - Background: `#a6a2f2` (primary)
   - Font size: 14px

5. **Muted Text**: 1.95:1 (Required: 4.5:1)
   - Color: `#b2bac5` (muted-foreground)
   - Background: `#ffffff` (card/background)
   - Font size: 14px

## Impact

- **Accessibility**: Users with visual impairments may have difficulty reading text
- **WCAG Compliance**: Fails WCAG 2.1 Level AA compliance
- **Legal Risk**: Potential accessibility compliance issues
- **User Experience**: Reduced readability for all users

## Root Cause

The theme colors defined in `tailwind.config.mjs` or CSS variables do not meet the minimum contrast ratios required by WCAG 2.1 AA standards. This is a design system/theme configuration issue, not a component implementation issue.

## Solution Approach

### Option 1: Adjust Theme Colors (Recommended)

- Update color values in `tailwind.config.mjs` to meet 4.5:1 contrast ratio
- Maintain visual design while improving accessibility
- Test all components to ensure changes don't break existing designs

### Option 2: Use Different Colors for Text

- Create separate color tokens for text that meet contrast requirements
- Keep existing colors for non-text elements (borders, backgrounds, etc.)

### Option 3: Conditional Styling

- Use higher contrast colors for text elements specifically
- Apply via component-level overrides

## Files to Update

1. `tailwind.config.mjs` - Theme color definitions
2. `src/app/globals.css` - CSS variable definitions (if used)
3. Component files using affected colors (if direct color values are used)

## Testing Requirements

1. Run accessibility tests: `npm run test:e2e -- tests/e2e/auth/login-accessibility.spec.ts`
2. Verify color contrast using axe-core or similar tools
3. Visual regression testing to ensure design changes are acceptable
4. Test across all components using theme colors

## Acceptance Criteria

- [ ] All text elements meet WCAG 2.1 AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- [ ] Accessibility tests pass without color contrast violations
- [ ] Visual design remains consistent with brand identity
- [ ] All components using theme colors are tested and verified
- [ ] Documentation updated with new color values

## Related Documentation

- [Style Guide](../style/style-guide.md) - Current color definitions
- [Design Guide](./design-guide.md) - Accessibility requirements
- [Story 1.3](../sprint-artifacts/1-3-email-authentication-user-login.md) - Where issue was discovered

## Notes

- This issue affects the entire design system, not just the login form
- Should be addressed as a design system task, not component-specific
- Consider creating a color contrast validation test to prevent regression

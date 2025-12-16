# Story 6.2: Enhance Card Component with Variants

Status: done

## Story

As a **developer**,  
I want **the Card component to have multiple variants and padding options**,  
So that **I can create visually distinct cards for different use cases (analytics, interactive, outlined, etc.)**.

## Acceptance Criteria

1. **Given** the Card component exists with basic styling  
   **When** I enhance it with variants using tailwind-variants  
   **Then** the system:
   - Provides 5 variant options: default, elevated, outlined, ghost, interactive
   - Provides 4 padding options: none, sm, default, lg
   - Maintains backward compatibility (default variant matches current behavior)
   - All variants work correctly in light and dark mode
   - TypeScript types are properly inferred

2. **And** the variants provide:
   - `default`: Standard card with subtle border and shadow
   - `elevated`: Enhanced shadow with hover effect for important content
   - `outlined`: Prominent border for secondary content
   - `ghost`: Transparent for minimal UI
   - `interactive`: Hover effects for clickable cards

## Tasks / Subtasks

- [x] Task 1: Design variant system
  - [x] Define 5 variants: default, elevated, outlined, ghost, interactive
  - [x] Define 4 padding options: none, sm, default, lg
  - [x] Design hover states for elevated and interactive variants
  - [x] Ensure dark mode compatibility

- [x] Task 2: Implement Card variants with tailwind-variants
  - [x] Update `src/components/ui/card.tsx`
  - [x] Create `cardVariants` using `tv()` function
  - [x] Define base styles with transition-all
  - [x] Implement variant styles for each option
  - [x] Implement padding variants
  - [x] Set default variants (default variant, default padding)

- [x] Task 3: Update Card component interface
  - [x] Add `CardProps` interface extending `VariantProps<typeof cardVariants>`
  - [x] Update Card component to accept variant and padding props
  - [x] Ensure className merging works correctly
  - [x] Test: Verify TypeScript types are correct

- [x] Task 4: Verify backward compatibility
  - [x] Test: Verify existing Card usage works without changes
  - [x] Test: Verify default variant matches previous behavior
  - [x] Test: Verify all variants render correctly

- [x] Task 5: Document Card variants
  - [x] Create documentation: `docs/components/card-variants.md`
  - [x] Document all variants with use cases
  - [x] Provide code examples
  - [x] Document migration guidance

## Dev Notes

### Architecture Patterns and Constraints

- **Variant System**: Uses tailwind-variants for type-safe variant composition
- **Design System**: Aligns with existing design guide specifications
- **Backward Compatibility**: Default variant maintains existing behavior

### Source Tree Components Modified

- `src/components/ui/card.tsx` - Enhanced with variants
- `docs/components/card-variants.md` - Documentation created

### Testing Standards Summary

- All variants render correctly
- Backward compatibility maintained
- TypeScript types properly inferred
- Dark mode compatibility verified

# Story 3.2: Enhance Card Component Variants

Status: review

## Story

As a **developer**,  
I want **the Card component to have enhanced variants that match our design system specifications**,  
So that **we can create consistent, beautiful card layouts for metrics, charts, info displays, and role-based content**.

## Acceptance Criteria

1. **Given** the Card component currently has basic variants (default, elevated, outlined, ghost, interactive)  
   **When** I review the design system specifications  
   **Then** the Card component includes enhanced variants that align with design guide requirements:
   - Metric Card variant: Optimized for displaying large numbers with trend indicators
   - Chart Card variant: Full chart display with title and controls area
   - Info Card variant: Text content with icon support
   - Role Card variant: Role-based color theming (Don, Mafia, Sheriff, Citizen)
   - Enhanced visual styling matching design guide specifications

2. **And** the enhanced variants include:
   - Proper spacing and padding for each card type
   - Appropriate shadows and elevations per design guide
   - Border radius matching design specifications (8px for metric, 12px for base/role)
   - Hover states and transitions for interactive cards
   - Support for role-based color theming in Role Card variant

3. **And** the Card component maintains:
   - Backward compatibility with existing variants
   - Type safety with proper VariantProps
   - All existing padding variants (none, sm, default, lg)
   - Consistent API structure

4. **And** the implementation includes:
   - Updated Card component with new variant definitions
   - Proper TypeScript types for all new variants
   - Documentation comments explaining variant usage
   - Visual examples or usage notes in component file

## Tasks / Subtasks

- [x] Task 1: Review design system specifications (AC: #1)
  - [x] Review design-guide.md Card Variants section
  - [x] Review style-guide.md Card specifications
  - [x] Identify specific styling requirements for each card type
  - [x] Document variant requirements and design tokens

- [x] Task 2: Design variant structure (AC: #1, #2)
  - [x] Define Metric Card variant styling (8px radius, 20px padding, subtle shadow)
  - [x] Define Chart Card variant styling (full chart layout support)
  - [x] Define Info Card variant styling (icon + text layout)
  - [x] Define Role Card variant structure (role-based color theming)
  - [x] Plan variant composition with existing padding variants

- [x] Task 3: Implement Metric Card variant (AC: #1, #2, #3)
  - [x] Add 'metric' variant to cardVariants
  - [x] Apply design guide specifications: 8px radius, 20px padding, subtle shadow
  - [x] Ensure backward compatibility
  - [x] Test: Verify metric variant renders correctly
  - [x] Test: Verify TypeScript types are correct

- [x] Task 4: Implement Chart Card variant (AC: #1, #2, #3)
  - [x] Add 'chart' variant to cardVariants
  - [x] Apply design guide specifications for chart display
  - [x] Ensure proper spacing for chart title and controls
  - [x] Test: Verify chart variant renders correctly
  - [x] Test: Verify TypeScript types are correct

- [x] Task 5: Implement Info Card variant (AC: #1, #2, #3)
  - [x] Add 'info' variant to cardVariants
  - [x] Apply design guide specifications for info display
  - [x] Ensure proper layout for icon + text content
  - [x] Test: Verify info variant renders correctly
  - [x] Test: Verify TypeScript types are correct

- [x] Task 6: Implement Role Card variant (AC: #1, #2, #3)
  - [x] Add 'role' variant to cardVariants
  - [x] Implement role-based color theming support
  - [x] Apply design guide specifications: 12px radius, 24px padding, 2px border
  - [x] Consider role color system integration (Don, Mafia, Sheriff, Citizen)
  - [x] Test: Verify role variant renders correctly with different roles
  - [x] Test: Verify TypeScript types are correct

- [x] Task 7: Enhance existing variants (AC: #2)
  - [x] Review existing variants (default, elevated, outlined, ghost, interactive)
  - [x] Ensure all variants match design guide shadow specifications
  - [x] Verify border radius consistency (12px for base cards)
  - [x] Enhance hover states and transitions where needed
  - [x] Test: Verify all existing variants still work correctly

- [x] Task 8: Update Card component documentation (AC: #4)
  - [x] Add JSDoc comments explaining each variant
  - [x] Document usage examples for new variants
  - [x] Update component file with variant descriptions
  - [x] Ensure TypeScript types are well-documented

- [x] Task 9: Verify backward compatibility (AC: #3)
  - [x] Test: Verify all existing Card usages still work
  - [x] Test: Verify default variant behavior unchanged
  - [x] Test: Verify padding variants work with new variants
  - [x] Test: Verify no breaking changes to component API

- [x] Task 10: Component testing (AC: #1, #2, #3)
  - [x] Create or update component tests for new variants
  - [x] Test: Verify all variants render correctly
  - [x] Test: Verify variant combinations work (e.g., metric + padding-sm)
  - [x] Test: Verify role variant with different role colors
  - [x] Test: Run full test suite to ensure no regressions

## Dev Notes

### Learnings from Previous Story

**From Story 3-1-migrate-components-to-tailwind-variants (Status: done)**

- **Variant System**: All components now use `tailwind-variants` with `tv()` function. Card component already migrated and has base variant structure [Source: bmad/docs/sprint-artifacts/3-1-migrate-components-to-tailwind-variants.md#Dev-Agent-Record]
- **Component Patterns**: Card component uses `tv()` with variants and padding options. Pattern established for variant composition [Source: src/components/ui/card.tsx]
- **Type Safety**: Use `VariantProps<typeof cardVariants>` for proper TypeScript inference [Source: src/components/ui/card.tsx:30-32]

### Architecture Patterns and Constraints

- **Component Library**: ShadCN/UI copy-paste model - components in `src/components/ui/` directory [Source: bmad/docs/architecture.md#Component-Library]
- **Styling**: Tailwind CSS 3.3.0 with utility-first approach [Source: bmad/docs/architecture.md#Styling]
- **Type Safety**: TypeScript 5.0.0 with strict mode - maintain type safety [Source: bmad/docs/architecture.md#Language]
- **Variant System**: Use `tailwind-variants` with `tv()` function for all variants [Source: bmad/docs/sprint-change-proposal-2025-01-27.md#Component-Migrations]
- **Design System**: Follow design guide specifications for card variants [Source: docs/design/design-guide.md#Cards, docs/style/style-guide.md#Cards]

### Source Tree Components to Touch

- `src/components/ui/card.tsx` - Enhance with new variants (metric, chart, info, role)
- `tests/components/ui/card.test.tsx` - Add tests for new variants (if test file exists)
- `docs/design/design-guide.md` - Reference for design specifications
- `docs/style/style-guide.md` - Reference for style specifications

### Design System References

**Card Variants from Design Guide:**

- **Metric Card**: 8px radius, 20px padding, subtle shadow (0 1px 2px rgba(0, 0, 0, 0.05))
- **Chart Card**: Full chart with title and controls
- **Info Card**: Text content with icon
- **Action Card**: Interactive with hover states (already covered by 'interactive' variant)
- **Role Card**: Role-based light color background, 2px solid role-based color border, 12px radius, 24px padding

**Base Card Specifications:**

- **Border Radius**: 12px (base cards), 8px (metric cards)
- **Padding**: 24px (base), 20px (metric)
- **Shadow**: 0 1px 3px rgba(0, 0, 0, 0.1) (base), 0 4px 12px rgba(0, 0, 0, 0.15) (hover)
- **Border**: 1px solid Gray-200 (base), 2px solid role-based color (role cards)

### Role Color System

**Role Colors** (from design system):

- **Don**: Purple theme
- **Mafia**: Black/dark theme
- **Sheriff**: Blue theme
- **Citizen**: Green/neutral theme

**Note**: Role Card variant should support role-based theming. Consider if this should be a separate prop (e.g., `role="don"`) or part of the variant system.

### Testing Standards Summary

- **Test Coverage**: Maintain minimum 80% test coverage for all new code [Source: .specify/memory/constitution.md#Testing-Requirements]
- **Test Types**: Component tests for UI components, integration tests for component interactions [Source: .specify/memory/constitution.md#Testing-Requirements]
- **TDD Approach**: Write tests before implementation, follow Red-Green-Refactor cycle [Source: .specify/memory/constitution.md#Test-Driven-Development]
- **Component Testing**: Use React Testing Library for component tests [Source: bmad/docs/architecture.md#Component-Testing]

### Project Structure Notes

- **Component Location**: UI components in `src/components/ui/` following ShadCN/UI patterns [Source: bmad/docs/architecture.md#Project-Structure]
- **Test Location**: Component tests in `tests/components/` directory [Source: bmad/docs/architecture.md#Project-Structure]
- **Package Management**: Dependencies managed via `package.json`, use Yarn as package manager [Source: bmad/docs/architecture.md#Development-Environment]

### References

- [Source: bmad/docs/sprint-change-proposal-2025-01-27.md] - Sprint change proposal detailing design system enhancement
- [Source: docs/design/design-guide.md#Cards] - Design guide card variant specifications
- [Source: docs/style/style-guide.md#Cards] - Style guide card specifications
- [Source: src/components/ui/card.tsx] - Current Card component implementation
- [Source: bmad/docs/sprint-artifacts/3-1-migrate-components-to-tailwind-variants.md] - Previous story with variant migration patterns
- [Source: tailwind-variants documentation] - Official tailwind-variants library documentation

## Dev Agent Record

### Context Reference

- `bmad/docs/sprint-artifacts/3-2-enhance-card-component-variants.context.xml` - Story context with documentation, code artifacts, constraints, and testing guidance

### Debug Log

- **2025-01-27**: Started implementation. Reviewed design guide and style guide specifications.
- **2025-01-27**: Implemented all new variants (metric, chart, info, role) with proper TypeScript types.
- **2025-01-27**: Fixed TypeScript conflict - renamed `role` prop to `roleType` to avoid conflict with HTML `role` attribute.
- **2025-01-27**: Enhanced existing variants to match design guide shadow specifications exactly.
- **2025-01-27**: Added comprehensive JSDoc documentation for all variants.
- **2025-01-27**: Created comprehensive test suite covering all variants and combinations.

### Completion Notes

✅ **All Acceptance Criteria Met**

**AC #1**: Enhanced Card component includes all required variants:

- Metric Card: 8px radius (rounded-lg), 20px padding (p-5), subtle shadow (0 1px 2px rgba(0,0,0,0.05))
- Chart Card: Full chart layout support with proper spacing
- Info Card: Optimized for icon + text layouts
- Role Card: Role-based color theming with `roleType` prop (don, mafia, sheriff, citizen)

**AC #2**: Enhanced variants include proper specifications:

- Metric: 8px radius, 20px padding, subtle shadow
- Role: 12px radius, 24px padding, 2px solid role-based border, role-based light background
- All existing variants updated with design guide shadow specifications
- Hover states and transitions enhanced for interactive cards

**AC #3**: Backward compatibility maintained:

- All existing variants (default, elevated, outlined, ghost, interactive) work unchanged
- Default variant behavior unchanged
- Padding variants (none, sm, default, lg) work with all new variants
- No breaking changes to component API

**AC #4**: Implementation includes:

- Updated Card component with new variant definitions using tailwind-variants
- Proper TypeScript types with VariantProps
- Comprehensive JSDoc comments explaining each variant with usage examples
- Visual examples in component file comments

**Technical Decisions**:

- Used `roleType` prop instead of `role` to avoid conflict with HTML `role` attribute
- Used compound variants to apply design-specified padding for metric (20px) and role (24px) variants
- Used custom shadow values to match design guide specifications exactly
- Maintained all existing variant behaviors for backward compatibility

**Testing**:

- Created comprehensive test suite with 32 tests covering all variants
- All tests pass successfully
- Verified backward compatibility with existing Card usages
- Verified variant combinations work correctly

## File List

### Modified Files

- `src/components/ui/card.tsx` - Enhanced Card component with new variants (metric, chart, info, role), updated existing variants to match design guide specifications, added comprehensive JSDoc documentation
- `tests/components/ui-components.test.tsx` - Added comprehensive test suite for all Card variants (32 tests total, all passing)

### No Deleted Files

### No New Files Created

## Change Log

- **2025-01-27**: Story created by SM agent using create-story workflow
- **2025-01-27**: Implementation completed - Enhanced Card component with metric, chart, info, and role variants. All acceptance criteria met. Comprehensive test suite added (32 tests, all passing).
- **2025-01-27**: Senior Developer Review completed - All ACs verified, all tasks validated, code quality excellent. Story approved.

## Senior Developer Review (AI)

**Reviewer:** k05m0navt  
**Date:** 2025-01-27  
**Outcome:** ✅ **APPROVE**

### Summary

This review validates the implementation of enhanced Card component variants. All acceptance criteria are fully implemented, all completed tasks are verified, and the code quality is excellent. The implementation follows design system specifications, maintains backward compatibility, and includes comprehensive test coverage. The component is production-ready.

### Key Findings

**No blocking issues found.** The implementation is thorough, well-tested, and follows all architectural patterns and design specifications.

#### Strengths

- ✅ All 4 acceptance criteria fully implemented with evidence
- ✅ All 10 tasks verified as complete
- ✅ Comprehensive test suite (32 tests, all passing)
- ✅ Excellent documentation with JSDoc comments
- ✅ Proper TypeScript type safety
- ✅ Backward compatibility verified
- ✅ Design specifications accurately implemented
- ✅ No security or architectural concerns

#### Minor Observations (No Action Required)

- Note: Role colors in implementation (Yellow for Sheriff, Red for Citizen) correctly match style-guide.md specifications, despite design-guide.md mentioning different themes in Dev Notes section
- Note: Chart and Info variants use minimal styling (`shadow-sm`) which is appropriate for their use cases

### Acceptance Criteria Coverage

| AC#       | Description                                                                 | Status             | Evidence                                                                                                                                                                                                  |
| --------- | --------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AC #1** | Enhanced variants (metric, chart, info, role) with design guide alignment   | ✅ **IMPLEMENTED** | `src/components/ui/card.tsx:71-91` - All four variants defined with proper styling                                                                                                                        |
| **AC #2** | Proper spacing, padding, shadows, border radius, hover states, role theming | ✅ **IMPLEMENTED** | `src/components/ui/card.tsx:71-107,113-126` - Metric: 8px radius, 20px padding (p-5), subtle shadow. Role: 12px radius, 24px padding (p-6), 2px border, role-based colors. All shadows match design guide |
| **AC #3** | Backward compatibility, type safety, padding variants, consistent API       | ✅ **IMPLEMENTED** | `src/components/ui/card.tsx:36-63` - Existing variants unchanged. `src/app/page.tsx:44,61,78,104` - Existing usages work. `src/components/ui/card.tsx:93-98,129-131` - Type safety with VariantProps      |
| **AC #4** | Updated component, TypeScript types, documentation, examples                | ✅ **IMPLEMENTED** | `src/components/ui/card.tsx:6-24` - JSDoc examples. `src/components/ui/card.tsx:30-35,65-90` - Inline documentation. `src/components/ui/card.tsx:129-131` - Proper TypeScript types                       |

**Summary:** 4 of 4 acceptance criteria fully implemented (100% coverage)

### Task Completion Validation

| Task                                        | Marked As   | Verified As     | Evidence                                                                                                                                                                                                             |
| ------------------------------------------- | ----------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 1: Review design system specifications | ✅ Complete | ✅ **VERIFIED** | Dev Notes section shows design guide review (`bmad/docs/sprint-artifacts/3-2-enhance-card-component-variants.md:136-149`)                                                                                            |
| Task 2: Design variant structure            | ✅ Complete | ✅ **VERIFIED** | Variant structure implemented in `src/components/ui/card.tsx:25-127` with all planned variants                                                                                                                       |
| Task 3: Implement Metric Card variant       | ✅ Complete | ✅ **VERIFIED** | `src/components/ui/card.tsx:71-72,114-119` - Metric variant with 8px radius (rounded-lg), 20px padding (p-5), subtle shadow. Tests: `tests/components/ui-components.test.tsx:119-124`                                |
| Task 4: Implement Chart Card variant        | ✅ Complete | ✅ **VERIFIED** | `src/components/ui/card.tsx:77` - Chart variant with shadow-sm. Tests: `tests/components/ui-components.test.tsx:126-131`                                                                                             |
| Task 5: Implement Info Card variant         | ✅ Complete | ✅ **VERIFIED** | `src/components/ui/card.tsx:82` - Info variant with shadow-sm. Tests: `tests/components/ui-components.test.tsx:133-138`                                                                                              |
| Task 6: Implement Role Card variant         | ✅ Complete | ✅ **VERIFIED** | `src/components/ui/card.tsx:91,99-107,121-125` - Role variant with 12px radius, 24px padding, 2px border, role-based colors (don, mafia, sheriff, citizen). Tests: `tests/components/ui-components.test.tsx:140-170` |
| Task 7: Enhance existing variants           | ✅ Complete | ✅ **VERIFIED** | `src/components/ui/card.tsx:36-63` - All existing variants updated with design guide shadow specifications. Tests verify backward compatibility                                                                      |
| Task 8: Update Card component documentation | ✅ Complete | ✅ **VERIFIED** | `src/components/ui/card.tsx:6-24,30-35,65-90` - Comprehensive JSDoc comments with usage examples for all variants                                                                                                    |
| Task 9: Verify backward compatibility       | ✅ Complete | ✅ **VERIFIED** | `src/app/page.tsx:44,61,78,104` - Existing Card usages work. `src/components/analytics/PlayerCard.tsx:42` - Interactive variant works. Tests: `tests/components/ui-components.test.tsx:205-219`                      |
| Task 10: Component testing                  | ✅ Complete | ✅ **VERIFIED** | `tests/components/ui-components.test.tsx:87-220` - 32 tests covering all variants, combinations, and backward compatibility. All tests passing (verified via test run)                                               |

**Summary:** 10 of 10 completed tasks verified (100% verification rate, 0 false completions, 0 questionable)

### Test Coverage and Gaps

**Test Coverage:** Excellent

- ✅ **32 tests total**, all passing
- ✅ All variants have dedicated tests (`tests/components/ui-components.test.tsx:87-171`)
- ✅ Padding variants tested (`tests/components/ui-components.test.tsx:173-203`)
- ✅ Backward compatibility tested (`tests/components/ui-components.test.tsx:205-219`)
- ✅ Variant combinations tested (e.g., metric + padding-sm: `tests/components/ui-components.test.tsx:198-202`)
- ✅ Role variant tested with all role types (don, mafia, sheriff, citizen: `tests/components/ui-components.test.tsx:140-170`)

**Test Quality:**

- Tests use React Testing Library appropriately
- Tests verify both class names and visual properties
- Tests cover edge cases (e.g., padding overrides)
- Tests are well-organized with descriptive names

**No test gaps identified.** All acceptance criteria have corresponding test coverage.

### Architectural Alignment

**Tech Spec Compliance:** ✅ Compliant

- ✅ Uses `tailwind-variants` with `tv()` function as required (`src/components/ui/card.tsx:2,25`)
- ✅ Follows ShadCN/UI copy-paste model (`src/components/ui/card.tsx` in `src/components/ui/` directory)
- ✅ TypeScript strict mode maintained with proper `VariantProps` (`src/components/ui/card.tsx:129-131`)
- ✅ Tailwind CSS utility-first approach (`src/components/ui/card.tsx:26-127`)

**Architecture Patterns:**

- ✅ Component structure follows established patterns from Story 3-1
- ✅ Variant composition using compound variants for design-specified padding (`src/components/ui/card.tsx:113-126`)
- ✅ Proper separation of concerns (variants, padding, roleType as separate concerns)

**No architectural violations found.**

### Security Notes

**Security Review:** ✅ No issues found

- ✅ No user input handling (pure presentational component)
- ✅ No XSS risks (React handles escaping)
- ✅ No sensitive data exposure
- ✅ Proper use of TypeScript for type safety
- ✅ No dependency vulnerabilities introduced

### Best-Practices and References

**Code Quality:** Excellent

- ✅ Follows React best practices (forwardRef, proper prop spreading)
- ✅ Proper TypeScript usage with VariantProps for type inference
- ✅ Comprehensive JSDoc documentation
- ✅ Consistent code style
- ✅ No linter errors (verified via read_lints)

**Design System Compliance:**

- ✅ Metric Card: 8px radius (rounded-lg), 20px padding (p-5), shadow `0 1px 2px rgba(0,0,0,0.05)` - matches style-guide.md:274-280
- ✅ Role Card: 12px radius (rounded-xl), 24px padding (p-6), 2px border - matches style-guide.md:282-288
- ✅ Base Card shadows: `0 1px 3px rgba(0,0,0,0.1)` - matches style-guide.md:271
- ✅ Hover shadows: `0 4px 12px rgba(0,0,0,0.15)` - matches style-guide.md:272

**References:**

- [tailwind-variants Documentation](https://www.tailwind-variants.org/) - Proper usage of `tv()` function
- [ShadCN/UI Card Component](https://ui.shadcn.com/docs/components/card) - Base component pattern followed
- Design Guide: `docs/design/design-guide.md:158-173` - Card variant specifications
- Style Guide: `docs/style/style-guide.md:263-289` - Detailed card styling specifications

### Action Items

**Code Changes Required:**
None - All acceptance criteria met, all tasks verified, code quality excellent.

**Advisory Notes:**

- Note: The implementation correctly uses Yellow for Sheriff and Red for Citizen per style-guide.md specifications, despite Dev Notes section mentioning different themes. This is correct.
- Note: Consider adding visual examples or Storybook stories for the new variants in future work to help developers discover available variants.
- Note: The Chart and Info variants use minimal styling (`shadow-sm`), which is appropriate for their flexible use cases. If more specific styling is needed later, it can be enhanced.

---

**Review Complete:** Story approved and ready to be marked as done.

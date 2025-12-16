# Story 6.3: Apply Card Variants to Dashboard Pages

Status: done

## Story

As a **user**,  
I want **dashboard pages to use appropriate Card variants for better visual hierarchy and UX**,  
So that **I can easily distinguish between different types of content and understand what's interactive**.

## Acceptance Criteria

1. **Given** the Card component has multiple variants  
   **When** I apply variants to dashboard pages  
   **Then** the system:
   - Home page feature cards use `elevated` variant
   - Role cards use `outlined` variant with `sm` padding
   - Analytics cards (PlayerCard, TournamentCard, ClubCard) use appropriate variants
   - Metric cards use `elevated` variant for importance
   - Interactive cards use `interactive` variant for clickable elements
   - All changes maintain existing functionality

2. **And** the application includes:
   - At least 3 dashboard pages updated with new variants
   - Consistent variant usage across similar components
   - Improved visual hierarchy and user experience

## Tasks / Subtasks

- [x] Task 1: Update home page cards
  - [x] Apply `elevated` variant to feature cards (Player, Team, Tournament)
  - [x] Apply `outlined` variant with `sm` padding to role cards
  - [x] Test: Verify cards render correctly
  - [x] Test: Verify hover effects work on elevated cards

- [x] Task 2: Update PlayerCard component
  - [x] Apply `interactive` variant to `src/components/analytics/PlayerCard.tsx`
  - [x] Verify clickable analytics button works
  - [x] Test: Verify hover effects indicate interactivity

- [x] Task 3: Update TournamentCard component
  - [x] Apply `elevated` variant to `src/components/analytics/TournamentCard.tsx`
  - [x] Test: Verify card displays tournament information correctly

- [x] Task 4: Update ClubCard component
  - [x] Apply `interactive` variant to `src/components/analytics/ClubCard.tsx`
  - [x] Test: Verify hover effects work correctly

- [x] Task 5: Update analytics components
  - [x] Apply `elevated` variant to ValidationSummaryCard
  - [x] Apply `elevated` variant to ImportSummary
  - [x] Apply `elevated` variant to PlayerStatistics overview cards
  - [x] Test: Verify all analytics cards display correctly

- [x] Task 6: Update player details page
  - [x] Apply `elevated` variant to metric cards in `src/app/(dashboard)/players/[id]/page.tsx`
  - [x] Test: Verify metric cards display correctly

- [x] Task 7: Verify consistency
  - [x] Review all updated pages for consistent variant usage
  - [x] Ensure similar content types use similar variants
  - [x] Test: Verify no visual regressions

## Dev Notes

### Architecture Patterns and Constraints

- **Design System**: Variants align with design guide specifications
- **UX Principles**: Elevated for importance, interactive for clickable, outlined for secondary
- **Consistency**: Similar content types use similar variants

### Source Tree Components Modified

- `src/app/page.tsx` - Home page cards
- `src/components/analytics/PlayerCard.tsx` - Interactive variant
- `src/components/analytics/TournamentCard.tsx` - Elevated variant
- `src/components/analytics/ClubCard.tsx` - Interactive variant
- `src/components/sync/ValidationSummaryCard.tsx` - Elevated variant
- `src/components/sync/ImportSummary.tsx` - Elevated variant
- `src/components/analytics/PlayerStatistics.tsx` - Elevated variant
- `src/app/(dashboard)/players/[id]/page.tsx` - Metric cards

### Testing Standards Summary

- All cards render correctly with new variants
- Hover effects work as expected
- No visual regressions
- Consistent variant usage across pages

# Component Inventory

## Overview

The application uses **131 React components** organized by feature area. Components are built with:

- **ShadCN/UI** - Base component library (Radix UI primitives)
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **React 19** - Component framework

---

## Component Organization

### UI Components (38 components)

**Location**: `src/components/ui/`

Base UI primitives from ShadCN/UI library:

- `alert.tsx` - Alert component
- `alert-dialog.tsx` - Alert dialog (confirmation dialogs)
- `avatar.tsx` - Avatar component
- `badge.tsx` - Badge component
- `button.tsx` - Button with variants (default, destructive, outline, secondary, ghost, link)
- `card.tsx` - Card component (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- `checkbox.tsx` - Checkbox component
- `dialog.tsx` - Dialog/Modal component
- `dropdown-menu.tsx` - Dropdown menu component
- `form.tsx` - Form components with validation
- `input.tsx` - Input field component
- `label.tsx` - Form label component
- `navigation-menu.tsx` - Navigation menu component
- `pagination.tsx` - Pagination component
- `popover.tsx` - Popover component
- `progress.tsx` - Progress bar component
- `radio-group.tsx` - Radio button group
- `scroll-area.tsx` - Scrollable area component
- `select.tsx` - Select dropdown component
- `separator.tsx` - Visual separator
- `sheet.tsx` - Sheet/sidebar component
- `skeleton.tsx` - Loading skeleton component
- `switch.tsx` - Toggle switch component
- `table.tsx` - Table component
- `tabs.tsx` - Tabs component
- `textarea.tsx` - Textarea component
- `toast.tsx` - Toast notification component
- `toaster.tsx` - Toast container
- `visually-hidden.tsx` - Visually hidden text (accessibility)

**Custom UI Components**:

- `DataTransition.tsx` - Data transition animations
- `FilterCard.tsx` - Filter card component
- `PageLoading.tsx` - Page loading indicator
- `RegionFilter.tsx` - Region filter component
- `SearchInput.tsx` - Search input with debounce
- `SortableTableHead.tsx` - Sortable table header
- `SortableToolbar.tsx` - Sortable toolbar
- `ThemeToggle.tsx` - Theme toggle button
- `YearFilter.tsx` - Year filter component

---

### Authentication Components (25 components)

**Location**: `src/components/auth/`

Authentication and authorization components:

- `AdminBootstrap.tsx` - Admin bootstrap flow
- `AuthError.tsx` - Authentication error display
- `AuthErrorHandler.tsx` - Error handling wrapper
- `AuthProvider.tsx` - Authentication context provider
- `AuthStatus.tsx` - Authentication status indicator
- `ConditionalRender.tsx` - Conditional rendering based on auth/role/permissions
- `ErrorAlert.tsx` - Error alert component
- `ErrorMessage.tsx` - Error message display
- `ErrorRecovery.tsx` - Error recovery component
- `GuestOnly.tsx` - Guest-only content wrapper
- `InlineAuthError.tsx` - Inline authentication error
- `LoginForm.tsx` - Login form component
- `PermissionGate.tsx` - Permission-based access control
- `ProtectedRoute.tsx` - Protected route wrapper
- `RetryAuthentication.tsx` - Retry authentication flow
- `RetryButton.tsx` - Retry button component
- `RoleGuard.tsx` - Role-based access guard
- `SessionExpiredModal.tsx` - Session expired modal
- `SessionExpiredToast.tsx` - Session expired toast notification
- `SignInButton.tsx` - Sign in button
- `SignOutButton.tsx` - Sign out button
- `SignupForm.tsx` - User registration form
- `UserMenu.tsx` - User menu dropdown
- `UserOnly.tsx` - User-only content wrapper
- `UserProfile.tsx` - User profile display

---

### Admin Components (16 components)

**Location**: `src/components/admin/`

Administrative interface components:

- `AdminBootstrapGuard.tsx` - Bootstrap guard (checks if admin exists)
- `AdminOnly.tsx` - Admin-only content wrapper
- `BootstrapAdminForm.tsx` - Bootstrap admin user form
- `CreateUserForm.tsx` - Create user form
- `DashboardMetrics.tsx` - Dashboard metrics display
- `EditUserForm.tsx` - Edit user form
- `ImportControls.tsx` - Import control panel
- `InvitationList.tsx` - User invitations list
- `PerformanceDashboard.tsx` - Performance dashboard
- `QuickActions.tsx` - Quick action buttons
- `RecentActivity.tsx` - Recent activity feed
- `SelectiveDataDelete.tsx` - Selective data deletion
- `SkippedPagesManager.tsx` - Skipped pages management
- `SystemHealthBadge.tsx` - System health indicator
- `UserManagement.tsx` - User management interface
- `UserRoleSelector.tsx` - User role selector

---

### Analytics Components (11 components)

**Location**: `src/components/analytics/`

Analytics and statistics display:

- `ClubCard.tsx` - Club card display
- `LiveUpdates.tsx` - Live updates component
- `MemberList.tsx` - Club member list
- `PerformanceChart.tsx` - Performance chart visualization
- `PlayerCard.tsx` - Player card display
- `PlayerStatistics.tsx` - Player statistics display
- `RoleStats.tsx` - Role-based statistics
- `TeamStats.tsx` - Team statistics
- `TournamentBracket.tsx` - Tournament bracket visualization
- `TournamentCard.tsx` - Tournament card display
- `TournamentHistory.tsx` - Tournament history

---

### Data Display Components (8 components)

**Location**: `src/components/data-display/`

Data presentation components:

- `DataTable.tsx` - Generic data table
- `GameFilters.tsx` - Game filtering interface
- `LiveSyncStatus.tsx` - Live sync status display
- `LoadingState.tsx` - Loading state indicator
- `PlayerFilters.tsx` - Player filtering interface
- `SyncLogsTable.tsx` - Sync logs table
- `SyncStatusIndicator.tsx` - Sync status indicator
- `SyncTriggerButton.tsx` - Sync trigger button

---

### Import Components (4 components)

**Location**: `src/components/import/`

Data import interface components:

- `ImportControlPanel.tsx` - Import control panel
- `ManualSyncDialog.tsx` - Manual sync dialog
- `RetryDialog.tsx` - Retry failed imports dialog
- `SkippedEntitiesTable.tsx` - Skipped entities table

---

### Sync Components (10 components)

**Location**: `src/components/sync/`

Data synchronization components:

- `CancelButton.tsx` - Cancel import button
- `DataIntegrityPanel.tsx` - Data integrity panel
- `ErrorMessagePanel.tsx` - Error message panel
- `ImportControls.tsx` - Import controls
- `ImportProgressCard.tsx` - Import progress card
- `ImportSummary.tsx` - Import summary display
- `RetryButton.tsx` - Retry button
- `ScraperErrorsPanel.tsx` - Scraper errors panel
- `SyncNotifications.tsx` - Sync notifications
- `ValidationSummaryCard.tsx` - Validation summary card

---

### Navigation Components (5 components)

**Location**: `src/components/navigation/`

Navigation and menu components:

- `AccessibleNavbar.tsx` - Accessible navigation bar
- `AuthControls.tsx` - Authentication controls
- `Navbar.tsx` - Main navigation bar
- `NavItem.tsx` - Navigation item component
- `ThemeToggle.tsx` - Theme toggle button

---

### Layout Components (3 components)

**Location**: `src/components/layout/`

Layout and structure components:

- `Layout.tsx` - Main layout wrapper
- `MobileNavigation.tsx` - Mobile navigation menu
- `ProfileDropdown.tsx` - Profile dropdown menu

---

### Profile Components (3 components)

**Location**: `src/components/profile/`

User profile components:

- `AvatarUpload.tsx` - Avatar upload component
- `ProfileEditor.tsx` - Profile editor form
- `ProfileHeader.tsx` - Profile header display

---

### Protected Components (3 components)

**Location**: `src/components/protected/`

Access control components:

- `AccessDenied.tsx` - Access denied page
- `ProtectedComponent.tsx` - Protected component wrapper
- `ProtectedRoute.tsx` - Protected route wrapper

---

### Provider Components (2 components)

**Location**: `src/components/providers/`

Context providers:

- `index.tsx` - Provider composition
- `ThemeProvider.tsx` - Theme context provider

---

### Form Components (1 component)

**Location**: `src/components/forms/`

- `FormDataPreservation.tsx` - Form data preservation utility

---

### Chart Components

**Location**: `src/components/charts/`

Chart visualization components (directory exists, components to be documented)

---

### Aceternity Components

**Location**: `src/components/aceternity/`

Aceternity UI components (directory exists, components to be documented)

---

### Shared Components

- `ErrorBoundary.tsx` - Error boundary component
- `LoadingSpinner.tsx` - Loading spinner component

---

## Component Patterns

### 1. ShadCN/UI Base Components

All UI components follow ShadCN/UI patterns:

- Built on Radix UI primitives
- Accessible by default
- TypeScript with proper types
- Variant-based styling with `class-variance-authority`
- Forward refs for proper DOM access

**Example Pattern**:

```typescript
const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <Element
        ref={ref}
        className={cn(baseStyles, variantStyles, className)}
        {...props}
      />
    );
  }
);
```

---

### 2. Authentication-Aware Components

Components that check authentication/authorization:

- `ConditionalRender` - Flexible conditional rendering
- `RoleGuard` - Role-based access
- `PermissionGate` - Permission-based access
- `ProtectedRoute` - Route protection
- `UserOnly`, `GuestOnly`, `AdminOnly` - Role-specific wrappers

---

### 3. Data Fetching Components

Components that fetch and display data:

- Use TanStack Query hooks
- Loading and error states
- Pagination support
- Filtering and sorting

---

### 4. Form Components

Form handling components:

- React Hook Form integration
- Zod validation
- Error handling
- Data preservation

---

## Component Dependencies

### External Libraries

- **@radix-ui/** - Headless UI primitives
- **lucide-react** - Icons
- **class-variance-authority** - Variant styling
- **tailwind-merge** - Tailwind class merging
- **clsx** - Conditional class names

### Internal Dependencies

- `@/lib/utils` - Utility functions (cn helper)
- `@/hooks/*` - Custom hooks
- `@/store/*` - Zustand stores
- `@/types/*` - TypeScript types
- `@/services/*` - Service layer

---

## Component Statistics

- **Total Components**: 131
- **UI Base Components**: 38
- **Feature Components**: 93
- **Authentication Components**: 25
- **Admin Components**: 16
- **Analytics Components**: 11
- **Data Display Components**: 8
- **Sync/Import Components**: 14
- **Navigation Components**: 5
- **Layout Components**: 3
- **Profile Components**: 3
- **Protected Components**: 3
- **Provider Components**: 2

---

## Accessibility Features

All components follow **WCAG 2.1 Level AA** standards:

- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: Proper ARIA attributes
- **Focus Management**: Visible focus indicators
- **Screen Reader Support**: Semantic HTML and ARIA
- **Color Contrast**: Meets WCAG contrast requirements
- **Error Handling**: Accessible error messages

---

## Component Reusability

### Highly Reusable Components

- UI base components (Button, Card, Input, etc.)
- Layout components (Layout, Navbar)
- Protected components (RoleGuard, PermissionGate)
- Data display components (DataTable, LoadingState)

### Feature-Specific Components

- Analytics components (PlayerStatistics, TournamentBracket)
- Admin components (UserManagement, ImportControls)
- Sync components (ImportProgressCard, ValidationSummaryCard)

---

## Component Testing

Components are tested with:

- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **@axe-core/playwright** - Accessibility testing

---

## Component Development Guidelines

1. **TypeScript First**: All components use TypeScript
2. **Accessibility**: WCAG 2.1 AA compliance required
3. **Error Handling**: Proper error boundaries and error states
4. **Loading States**: Loading indicators for async operations
5. **Responsive Design**: Mobile-first approach
6. **Performance**: Memoization where appropriate
7. **Documentation**: JSDoc comments for complex components

Generated: 2025-11-22T17:39:05.300Z

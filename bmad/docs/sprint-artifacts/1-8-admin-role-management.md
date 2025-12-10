# Story 1.8: Admin Role Management

Status: ready-for-dev

## Story

As an **administrator**,  
I want **to manage user roles and permissions**,  
So that **I can control access levels and platform administration**.

## Acceptance Criteria

1. **Given** I am logged in as an administrator  
   **When** I access the admin user management page  
   **Then** the system displays:
   - List of all users with pagination (50 users per page)
   - User information: email, display name, role, account status, last login
   - Search functionality to find users by email or name
   - Filter by role (User, Admin, etc.)

2. **And** when I modify a user's role:
   - Dropdown selector shows available roles (User, Admin)
   - Changes save immediately with confirmation feedback
   - Role changes are logged for audit trail
   - System prevents removing the last admin (validation error)
   - Users with changed roles see updated permissions on next request

3. **And** security:
   - Only administrators can access admin pages (route protection)
   - Role changes require admin confirmation (are you sure dialog)
   - All admin actions logged to audit log

## Tasks / Subtasks

- [ ] Task 1: Implement admin route protection middleware (AC: #3)
  - [ ] Extend existing route protection: `src/proxy.ts` or create admin-specific route guards
  - [ ] Implement `requireAdmin` middleware function that checks user role
  - [ ] Protect admin routes: `/admin/users`, `/admin/settings`, etc.
  - [ ] Redirect non-admin users to dashboard with access denied message
  - [ ] Test: Verify middleware correctly identifies admin routes
  - [ ] Test: Verify non-admin users are redirected

- [ ] Task 2: Create admin users API endpoint (AC: #1)
  - [ ] Create API route: `src/app/api/admin/users/route.ts`
  - [ ] Implement GET handler with pagination (50 users per page)
  - [ ] Return user list with: email, display name, role, account status, last login
  - [ ] Implement search by email or name (query parameter)
  - [ ] Implement filter by role (query parameter)
  - [ ] Add admin role check using `requireAdmin` middleware
  - [ ] Test: Verify API returns paginated user list
  - [ ] Test: Verify search functionality works
  - [ ] Test: Verify filter by role works
  - [ ] Test: Verify non-admin users receive 403 Forbidden

- [ ] Task 3: Create admin user role update API endpoint (AC: #2)
  - [ ] Create API route: `src/app/api/admin/users/[id]/role/route.ts`
  - [ ] Implement PATCH handler to update user role
  - [ ] Validate available roles (User, Admin)
  - [ ] Prevent removing last admin (validation error)
  - [ ] Log role changes to audit log
  - [ ] Add admin role check using `requireAdmin` middleware
  - [ ] Return updated user data
  - [ ] Test: Verify role update works correctly
  - [ ] Test: Verify last admin protection works
  - [ ] Test: Verify audit logging works
  - [ ] Test: Verify non-admin users receive 403 Forbidden

- [ ] Task 4: Create audit log service (AC: #2, #3)
  - [ ] Create service: `src/lib/audit/audit-log.ts`
  - [ ] Implement `logAdminAction` function
  - [ ] Store: action type, admin user ID, target user ID, old role, new role, timestamp
  - [ ] Use Prisma to store in `audit_log` table (create migration if needed)
  - [ ] Test: Verify audit log entries are created correctly
  - [ ] Test: Verify audit log includes all required fields

- [ ] Task 5: Create admin users management page (AC: #1)
  - [ ] Create page: `src/app/admin/users/page.tsx`
  - [ ] Display user list with pagination controls
  - [ ] Display user information: email, display name, role, account status, last login
  - [ ] Add search input for email/name filtering
  - [ ] Add role filter dropdown
  - [ ] Use ShadCN/UI Table component for user list
  - [ ] Use ShadCN/UI Input and Select components for filters
  - [ ] Ensure responsive design (mobile-first: 320px, 768px, 1024px, 1440px)
  - [ ] Ensure WCAG 2.1 Level AA accessibility compliance
  - [ ] Test: Verify page displays user list correctly
  - [ ] Test: Verify pagination works
  - [ ] Test: Verify search works
  - [ ] Test: Verify role filter works
  - [ ] Test: Verify page is accessible

- [ ] Task 6: Create user role management component (AC: #2)
  - [ ] Create component: `src/components/admin/UserRoleManager.tsx`
  - [ ] Display current user role
  - [ ] Add dropdown selector for available roles (User, Admin)
  - [ ] Show confirmation dialog before role change ("Are you sure?" dialog)
  - [ ] Implement role update functionality
  - [ ] Show loading state during update
  - [ ] Show success/error feedback (toast notifications)
  - [ ] Display validation error if trying to remove last admin
  - [ ] Use ShadCN/UI Select, Dialog, Button, and Toast components
  - [ ] Ensure responsive design and accessibility
  - [ ] Test: Verify role dropdown displays correctly
  - [ ] Test: Verify confirmation dialog appears
  - [ ] Test: Verify role update works
  - [ ] Test: Verify last admin protection shows error
  - [ ] Test: Verify component is accessible

- [ ] Task 7: Create admin audit log page (AC: #3)
  - [ ] Create page: `src/app/admin/audit-log/page.tsx`
  - [ ] Display audit log entries in table format
  - [ ] Show: action type, admin user, target user, old role, new role, timestamp
  - [ ] Add pagination for audit log entries
  - [ ] Add date range filter
  - [ ] Use ShadCN/UI Table component
  - [ ] Ensure responsive design and accessibility
  - [ ] Test: Verify audit log displays correctly
  - [ ] Test: Verify pagination works
  - [ ] Test: Verify date range filter works
  - [ ] Test: Verify page is accessible

- [ ] Task 8: Update User model schema for audit log (AC: #4)
  - [ ] Check if `audit_log` table exists in Prisma schema
  - [ ] If not, create `AuditLog` model in `prisma/schema.prisma`:
    - id (UUID, primary key)
    - actionType (String, enum: ROLE_CHANGE, USER_DELETE, etc.)
    - adminUserId (String, foreign key to User)
    - targetUserId (String, foreign key to User, nullable)
    - oldValue (String, nullable, for old role)
    - newValue (String, nullable, for new role)
    - metadata (JSON, nullable, for additional context)
    - createdAt (DateTime)
  - [ ] Create migration: `yarn db:migrate dev --name add_audit_log`
  - [ ] Test: Verify migration runs successfully
  - [ ] Test: Verify AuditLog model can be created

- [ ] Task 9: Update navigation to include admin section (AC: #1)
  - [ ] Update navigation component: `src/components/navigation/MainNavigation.tsx` or `src/components/auth/UserMenu.tsx`
  - [ ] Show "Admin" menu item only for admin users
  - [ ] Add dropdown with: "User Management", "Audit Log", "Settings" (if applicable)
  - [ ] Ensure navigation is accessible and responsive
  - [ ] Test: Verify admin menu appears for admin users
  - [ ] Test: Verify admin menu hidden for non-admin users
  - [ ] Test: Verify navigation links work correctly

- [ ] Task 10: Add last admin validation logic (AC: #2)
  - [ ] Create validation function: `src/lib/validation/admin-validation.ts`
  - [ ] Implement `validateNotLastAdmin` function
  - [ ] Query database to count admin users
  - [ ] Throw validation error if trying to change last admin to non-admin
  - [ ] Use Prisma to query User model where role = 'ADMIN'
  - [ ] Test: Verify validation prevents removing last admin
  - [ ] Test: Verify validation allows removing admin if multiple admins exist
  - [ ] Test: Verify validation error message is clear

- [ ] Task 11: Integration and E2E testing (AC: #1, #2, #3)
  - [ ] Create integration test for admin user management flow
  - [ ] Test: Admin logs in → Accesses admin/users → Views user list → Updates user role → Verifies audit log
  - [ ] Test: Non-admin user tries to access admin routes → Redirected with access denied
  - [ ] Test: Admin tries to remove last admin → Validation error shown
  - [ ] Create E2E accessibility test for admin pages
  - [ ] Test: Verify complete admin user management flow is accessible
  - [ ] Test: Verify admin pages work on mobile devices

## Dev Notes

### Learnings from Previous Story

**From Story 1-7-guest-access-capability (Status: done)**

- **Auth Infrastructure Available**: NextAuth.js configured with OAuth providers and CredentialsProvider. Session management helpers available at `src/lib/auth/nextauth-helpers.ts`. Use existing authentication infrastructure for admin role checking. User model has `role` field that can be checked for admin access.
- **Route Protection Patterns**: Route protection middleware patterns established via `src/proxy.ts`. Use similar pattern for admin route protection. Create `requireAdmin` middleware function that checks user role from session.
- **Component Patterns**: ShadCN/UI components established. Use Table, Select, Dialog, Button, Input, and Toast components from `src/components/ui/`. Follow existing component patterns for forms and data display.
- **API Endpoint Pattern**: API endpoints follow pattern in `src/app/api/` directory. Admin endpoints should be in `src/app/api/admin/` directory. Use `authenticateRequest` middleware pattern from existing API endpoints.
- **Accessibility Testing**: E2E accessibility tests framework established using @axe-core/playwright. Follow patterns from `tests/e2e/guest-accessibility.spec.ts` for accessibility testing.
- **Testing Standards**: Testing standards require 80% coverage minimum, TDD approach. Unit tests for components and utilities, integration tests for admin flows, E2E tests for complete admin journey.
- **State Management**: TanStack Query for server state (user list, audit log), Zustand for client state if needed. Use TanStack Query for fetching user list and audit log entries.
- **Review Findings**: Previous story had issues with missing tests - ensure all test subtasks actually create test files. Previous story had route protection middleware verification needed - ensure admin middleware is properly configured and tested.

[Source: bmad/docs/sprint-artifacts/1-7-guest-access-capability.md#Dev-Agent-Record]

### Architecture Patterns and Constraints

- **Route Protection**: Use Next.js middleware or route guards to protect admin routes [Source: bmad/docs/epics.md#Story-1.8-Technical-Notes]
- **Role-Based Access Control**: Role-based access control (RBAC) implementation with User and Admin roles [Source: bmad/docs/epics.md#Story-1.8-Technical-Notes]
- **Admin Routes**: Admin routes: `/admin/users`, `/admin/settings`, etc. [Source: bmad/docs/epics.md#Story-1.8-Technical-Notes]
- **Middleware**: Middleware to check admin role on protected routes [Source: bmad/docs/epics.md#Story-1.8-Technical-Notes]
- **Audit Logging**: Store admin actions in audit_log table [Source: bmad/docs/epics.md#Story-1.8-Technical-Notes]
- **Authentication**: Use NextAuth.js for session management and role checking [Source: bmad/docs/architecture.md#Authentication]
- **Authorization**: Use RBAC with User roles: `guest`, `user`, `moderator`, `admin` [Source: bmad/docs/architecture.md#Authorization]
- **State Management**: Use TanStack Query for server state (user list, audit log), Zustand for client state if needed [Source: bmad/docs/architecture.md#State-Management]
- **Responsive Design**: Mobile-first approach with breakpoints at 320px, 768px, 1024px, 1440px [Source: bmad/docs/architecture.md#Responsive-Design]
- **Accessibility**: WCAG 2.1 Level AA compliance required, minimum 4.5:1 color contrast ratio for text [Source: bmad/docs/architecture.md#Accessibility]

### Source Tree Components to Touch

- `src/proxy.ts` - Extend route protection for admin routes OR create `src/lib/middleware/admin-middleware.ts` for admin-specific checks
- `src/app/api/admin/users/route.ts` - Create admin users list API endpoint
- `src/app/api/admin/users/[id]/role/route.ts` - Create admin user role update API endpoint
- `src/lib/audit/audit-log.ts` - Create audit log service
- `src/app/admin/users/page.tsx` - Create admin users management page
- `src/components/admin/UserRoleManager.tsx` - Create user role management component
- `src/app/admin/audit-log/page.tsx` - Create admin audit log page
- `prisma/schema.prisma` - Update schema with AuditLog model if needed
- `src/lib/validation/admin-validation.ts` - Create admin validation functions
- `src/components/navigation/MainNavigation.tsx` or `src/components/auth/UserMenu.tsx` - Update navigation for admin menu
- `src/lib/auth/nextauth-helpers.ts` - May need to extend for admin role checking

### Testing Standards Summary

- **Test Coverage**: Maintain minimum 80% test coverage for all new code [Source: .specify/memory/constitution.md#Testing-Requirements]
- **Test Types**: Unit tests for components and utilities, integration tests for admin flows, E2E tests for complete admin journey, accessibility tests using axe-core [Source: .specify/memory/constitution.md#Testing-Requirements]
- **TDD Approach**: Write tests before implementation, follow Red-Green-Refactor cycle [Source: .specify/memory/constitution.md#Test-Driven-Development]
- **Accessibility Testing**: Use @axe-core/playwright for E2E accessibility testing, verify WCAG 2.1 AA compliance [Source: bmad/docs/architecture.md#Testing]
- **Admin Flow Testing**: Test complete flow (admin login → access admin/users → view list → update role → verify audit log), test non-admin access denial, test last admin protection, test audit logging
- **Route Protection Testing**: Test middleware correctly identifies admin routes, test redirects work correctly, test authentication requirements

### Project Structure Notes

- **Component Location**: Admin components in `src/components/admin/` directory, UI components in `src/components/ui/` [Source: bmad/docs/architecture.md#Project-Structure]
- **API Routes**: Admin endpoints in `src/app/api/admin/` directory [Source: bmad/docs/architecture.md#Project-Structure]
- **Middleware**: Next.js middleware in `src/proxy.ts` at project root, or create admin-specific middleware helpers [Source: bmad/docs/architecture.md#Project-Structure]
- **Route Structure**: Admin pages in `src/app/admin/` directory [Source: bmad/docs/architecture.md#Project-Structure]
- **Audit Log**: Service layer in `src/lib/audit/` directory, Prisma model in `prisma/schema.prisma`

### References

- [Source: bmad/docs/epics.md#Story-1.8-Admin-Role-Management] - Story acceptance criteria and technical notes
- [Source: bmad/docs/architecture.md#Authentication] - Authentication and authorization patterns
- [Source: bmad/docs/architecture.md#Authorization] - Role-based access control implementation
- [Source: bmad/docs/architecture.md#API-Contracts] - API request/response format patterns
- [Source: bmad/docs/architecture.md#Naming-Patterns] - Naming conventions for files, components, and functions
- [Source: bmad/docs/architecture.md#Error-Handling] - Error handling patterns
- [Source: bmad/docs/sprint-artifacts/1-7-guest-access-capability.md] - Previous story learnings and patterns

## Dev Agent Record

### Context Reference

- `bmad/docs/sprint-artifacts/1-8-admin-role-management.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
